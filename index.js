// Configuration for your app

require('dotenv').config()
// Configuration for your app



const uuid = require('uuid');

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

let storedData
app.use(jsonParser);

app.use(urlencodedParser);


app.use(express.static(getDir() +"/web/"));


app.get('/', (req, res) =>res.sendFile(getDir() + '/web/index.html'));

let sockets ={}

ioServer.on('connection',async (socket) => {
    sockets[socket.id]=socket
    socket.on('disconnect', () => {
        delete sockets[socket.id]
    });

    socket.on("creds",async(request)=>{
        const {password}=request
        storedData = await persist.get()
        if(storedData.password==password){
            socket.emit("creds",await creds.get())
        }
    })

    socket.on("set_creds",async(request)=>{
        const {password,data}=request
        storedData = await persist.get()
        if(storedData.password==password){
            socket.emit("set_creds",await creds.set(data))
        }
    })

    socket.on("login",async(request)=>{
        const {password}=request
        storedData = await persist.get()
        if(storedData.password==password){
            socket.emit("login",await orderClient.login(()=>{
                Object.values(sockets).forEach(async socket=>{
                    socket.emit("data",{data:await persist.get(),strategies:await strategy.get(),kiteKey:process.env.KITE_API_KEY})
                })
            }))
        }
    })

    socket.on('change', async(request) => {
        const {password,data}=request
        storedData = await persist.get()
        if(storedData.password==password){
            const {type,strategyId,brokerName,value}=data
            const strategies=await strategy.get()
            strategies[strategyId][brokerName][type]=value
            await strategy.set(strategies)
            socket.emit("change",{})
        }
    });

    socket.on('exit', async(request) => {
        const {password,data}=request
        storedData = await persist.get()
        if(storedData.password==password){
            const {strategyId,brokerName}=data
            await orderClient.exit(strategyId,brokerName,()=>{
                socket.emit("exit",{})

            })
        }
    });


    socket.on('enter', async(request) => {
        const {password,data}=request
        storedData = await persist.get()
        if(storedData.password==password){
            const {strategyId,brokerName}=data
            await orderClient.enter(strategyId,brokerName,()=>{
                socket.emit("enter",{})

            })
        }
    });
    socket.on('data', async(request) => {
        let {password,id}=request
        storedData = await persist.get()
        id=process.env.MY_TELEGRAM_ID||id
        if(storedData.password==password){
            socket.emit("data",{data:await persist.get(),strategies:await strategy.get(),kiteKey:process.env.KITE_API_KEY})
        }
        else if(id){
            console.log("SENDING PASSWORD")
            await orderClient.sendId(id)
        }
    })


});




server.listen(process.env.PORT||1300, async() => {
    await creds.init();
    await strategy.init();
    storedData = await persist.get()
    storedData.password=uuid.v1()
    await persist.set(storedData)
    await orderClient.init(()=>{
        Object.values(sockets).forEach(async socket=>{
            socket.emit("data",{data:await persist.get(),strategies:await strategy.get(),kiteKey:process.env.KITE_API_KEY})
        })
    })
    const url = process.env.HEROKU_APP_NAME?`https://${process.env.HEROKU_APP_NAME}.herokuapp.com/?password=${storedData.password}`:`http://localhost:${process.env.PORT||1300}/?password=${storedData.password}`
    storedData = await persist.get()
    storedData.url=url
    await persist.set(storedData)
    console.log("Default Directory",getDir())
    console.log('listening on *:',process.env.PORT||1300);
    console.log(`Click here to open link ${url}`)
    console.log("PASSWORD is",storedData.password)
});




// Using a function to set default app path
function getDir() {
    if (process.pkg) {
        return path.resolve(process.execPath + "/..");
    } else {
        return path.join(require.main ? require.main.path : process.cwd());
    }
}


    