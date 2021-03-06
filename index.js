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
    socket.on('disconnect', () => {
        delete sockets[socket.id]
    });

    socket.on("creds",async(request)=>{
        storedData = await persist.get()
        if(storedData.passwordSkip){
            socket.emit("creds",await creds.get())
        }
        else{
            socket.emit("no_auth",{})
        }
    })

    socket.on("set_creds",async(request)=>{
        const {data}=request
        if(storedData.passwordSkip){
            socket.emit("set_creds",await creds.set(data))
        }
        else{
            socket.emit("no_auth",{})
        }
    })

    socket.on("login",async(request)=>{
        const {password}=request
        storedData = await persist.get()
        if(storedData.password==password||storedData.passwordSkip){
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
        if(storedData.password==password||storedData.passwordSkip){
            const {type,strategyId,brokerName,value}=data
            const strategies=await strategy.get()
            strategies[strategyId][brokerName][type]=value
            await strategy.set(strategies)
            socket.emit("change",{})
        }
    });


    socket.on('add_strategy', async(request) => {
        const {password,data}=request
        if(storedData.password==password||storedData.passwordSkip){
            const {strategyName,brokerName,qty}=data
            const strategies=await strategy.get()
            strategies[strategyName]=strategies[strategyName]||{}
            strategies[strategyName][brokerName]={
                "ORDER":false,
                "HEDGE":true,
                "QTY":qty
            }
            await strategy.set(strategies)
            socket.emit("add_strategy",strategies)
        }
    });

    socket.on('exit', async(request) => {
        const {password,data}=request
        storedData = await persist.get()
        if(storedData.password==password||storedData.passwordSkip){
            const {strategyId,brokerName}=data
            await orderClient.exit(strategyId,brokerName,()=>{
                socket.emit("exit",{})

            })
        }
    });


    socket.on('enter', async(request) => {
        const {password,data}=request
        storedData = await persist.get()
        if(storedData.password==password||storedData.passwordSkip){
            const {strategyId,brokerName}=data
            await orderClient.enter(strategyId,brokerName,()=>{
                socket.emit("enter",{})

            })
        }
    });
    socket.on('data', async(request) => {
        let {password}=request
        storedData = await persist.get()
        if(process.env.MY_TELEGRAM_ID=='undefined'){
            delete process.env.MY_TELEGRAM_ID
        }
        if(storedData.password==password||storedData.passwordSkip){
            sockets[socket.id]=socket
            socket.emit("data",{data:await persist.get(),strategies:await strategy.get(),kiteKey:process.env.KITE_API_KEY})
        }
        else if(process.env.MY_TELEGRAM_ID){
            console.log("SENDING PASSWORD")
            await orderClient.sendId(process.env.MY_TELEGRAM_ID)
            socket.emit("redirect",{})
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

    console.log("SENDING PASSWORD")
    await orderClient.sendId(process.env.MY_TELEGRAM_ID)
    storedData = await persist.get()
    storedData.passwordSkip=process.env.HEROKU_APP_NAME?false:true
    await persist.set(storedData)
    console.log('listening on *:',process.env.PORT||1300);
    console.log(`Click here to open link ${storedData.url}`)
    console.log("PASSWORD is",storedData.password)
});




// Using a function to set default app path
function getDir() {
    if (process.pkg) {
        return path.resolve(process.execPath + "/..");
    } else {
        return path.join(require.main&&require.main.path ? require.main.path : process.cwd());
    }
}


    