// Configuration for your app

require('dotenv').config()
// Configuration for your app




const path = require("path")

const orderClient=require("./orderClient")

const persist = require("./storage/persist")
const strategy = require("./storage/strategy")
const creds = require("./storage/creds")
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const ioServer = new Server(server);
const jsonParser = express.json({
    limit: 1024 * 1024 * 20,
    type: "application/json"
});

const urlencodedParser = express.urlencoded({
    limit: 1024 * 1024 * 20,
    type: "application/x-www-form-urlencoded"
});


app.use(jsonParser);

app.use(urlencodedParser);


app.use(express.static(getDir() +"/web/"));


app.get('/', (req, res) => {
    res.sendFile(getDir() + '/web/index.html');
});

let sockets ={}

ioServer.on('connection',async (socket) => {
    sockets[socket.id]=socket
    socket.on('disconnect', () => {
        delete sockets[socket.id]
    });

    socket.on("creds",async()=>{
        socket.emit("creds",await creds.get())
    })

    socket.on("set_creds",async(data)=>{
        socket.emit("set_creds",await creds.set(data))
    })

    socket.on("login",async()=>{
        socket.emit("login",await orderClient.login(()=>{
            Object.values(sockets).forEach(async socket=>{
                socket.emit("data",{data:await persist.get(),strategies:await strategy.get(),kiteKey:process.env.KITE_API_KEY})
            })
        }))
    })

    socket.on('change', async(data) => {
        const {type,strategyId,brokerName,value}=data
        const strategies=await strategy.get()
        strategies[strategyId][brokerName][type]=value
        await strategy.set(strategies)
        socket.emit("change",{})
    });
    socket.emit("data",{data:await persist.get(),strategies:await strategy.get(),kiteKey:process.env.KITE_API_KEY})

    socket.on('enter', async(data) => {
        const {strategyId,brokerName}=data
        await orderClient.enter(strategyId,brokerName,()=>{
            socket.emit("enter",{})

        })
    });

    socket.on('exit', async(data) => {
        const {strategyId,brokerName}=data
        await orderClient.exit(strategyId,brokerName,()=>{
            socket.emit("exit",{})

        })
    });
});




server.listen(process.env.PORT||1300,"127.0.0.1", async() => {
    await creds.init();
    await strategy.init();
    await orderClient.init(()=>{
        Object.values(sockets).forEach(async socket=>{
            socket.emit("data",{data:await persist.get(),strategies:await strategy.get(),kiteKey:process.env.KITE_API_KEY})
        })
    })

    console.log('listening on *:',process.env.PORT||1300);
    console.log(`Click here to open link http://localhost:${process.env.PORT||1300}`)
});




// Using a function to set default app path
function getDir() {
    if (process.pkg) {
        return path.resolve(process.execPath + "/..");
    } else {
        return path.join(require.main ? require.main.path : process.cwd());
    }
}


    