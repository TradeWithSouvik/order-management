
const fetch = require("node-fetch");
const crypto = require("crypto")
const broker = require("./brokers/app")
const kite = require("./brokers/kite/app")
const angel = require("./brokers/angel/app")
const fp = require("./brokers/5paisa/app");
const finvasia = require("./brokers/finvasia/app");
const io = require("socket.io-client")
const socket = io("wss://paisashare.in", {path: '/user-auth/socket.io/'});
const persist = require("./storage/persist")
const strategy = require("./storage/strategy")
let strategyConfig

let storedData={}
module.exports={
    init:async (updateCallback)=>{ 
        socket.on("connect",async()=>{
            await login(updateCallback)
        })
    },
    enter:async(strategyId,brokerName,updateCallback)=>{
        try{
            let today = new Date()
            let time=`${today.getHours()}:${today.getMinutes()<10?"0"+today.getMinutes():today.getMinutes()}`
            storedData = await persist.get()
            strategyConfig=await strategy.get()
            const {position,expiry}=storedData.position[strategyId]
            let requestOrders=[]
            if(position.legs.call){
                requestOrders=[{
                    type:"SELL",
                    optionType:"CE",
                    time,
                    ltp:position.legs.call.ltp,
                    strike:position.legs.call.strike,
                    script:position.script,
                    kiteExpiryPrefix:position.kiteExpiryPrefix
                },{
                    type:"SELL",
                    optionType:"PE",
                    time,
                    ltp:position.legs.put.ltp,
                    strike:position.legs.put.strike,
                    script:position.script,
                    kiteExpiryPrefix:position.kiteExpiryPrefix
                },{
                    type:"BUY",
                    optionType:"CE",
                    time,
                    ltp:position.hedges.call.ltp,
                    strike:position.hedges.call.strike,
                    isHedge:true,
                    script:position.script,
                    kiteExpiryPrefix:position.kiteExpiryPrefix
                },{
                    type:"BUY",
                    optionType:"PE",
                    time,
                    ltp:position.hedges.put.ltp,
                    strike:position.hedges.put.strike,
                    isHedge:true,
                    script:position.script,
                    kiteExpiryPrefix:position.kiteExpiryPrefix
                }]
            }
            else if(position.context.strikeAtm){
                requestOrders=[{
                    type:"SELL",
                    optionType:"CE",
                    strike:position.context.strikeAtm,
                    script:position.script,
                    kiteExpiryPrefix:position.kiteExpiryPrefix
                },{
                    type:"SELL",
                    optionType:"PE",
                    strike:position.context.strikeAtm,
                    script:position.script,
                    kiteExpiryPrefix:position.kiteExpiryPrefix
                }]
            }

            if(strategyConfig[strategyId]){
                console.log("Trading orders",strategyId,expiry,requestOrders)
                
                storedData.orderTimeline=storedData.orderTimeline||[]
                storedData.orderTimeline.push({timestamp:formatDateTime(new Date()),requestOrders,strategyId,expiry})
                await persist.set(storedData)
                await broker.order(strategyId,requestOrders,{sendMessage:async(error)=>{
                    console.log(strategyId,error)
                    storedData = await persist.get()
                    storedData.errors=storedData.errors||[]
                    storedData.errors.push({timestamp:formatDateTime(new Date()),error,strategyId,expiry})
                    await persist.set(storedData)
                }},expiry,(brokerName=="KITE"),(brokerName=="FIVEPAISA"),(brokerName=="FINVASIA"),(brokerName=="ANGEL"))
            }
        }
        catch(e){
            console.log(e)
        }
        finally{
            updateCallback()
        }
    },
    exit:async(strategyId,brokerName,updateCallback)=>{
        try{
            let today = new Date()
            let time=`${today.getHours()}:${today.getMinutes()<10?"0"+today.getMinutes():today.getMinutes()}`
            storedData = await persist.get()
            strategyConfig=await strategy.get()
            const {position,expiry}=storedData.position[strategyId]
            let requestOrders
            if(position.legs.call){
                requestOrders=[{
                    type:"BUY",
                    optionType:"CE",
                    time,
                    ltp:position.legs.call.ltp,
                    strike:position.legs.call.strike,
                    script:position.script,
                    kiteExpiryPrefix:position.kiteExpiryPrefix
                },{
                    type:"BUY",
                    optionType:"PE",
                    time,
                    ltp:position.legs.put.ltp,
                    strike:position.legs.put.strike,
                    script:position.script,
                    kiteExpiryPrefix:position.kiteExpiryPrefix
                },{
                    type:"SELL",
                    optionType:"CE",
                    time,
                    ltp:position.hedges.call.ltp,
                    strike:position.hedges.call.strike,
                    isHedge:true,
                    script:position.script,
                    kiteExpiryPrefix:position.kiteExpiryPrefix
                },{
                    type:"SELL",
                    optionType:"PE",
                    time,
                    ltp:position.hedges.put.ltp,
                    strike:position.hedges.put.strike,
                    isHedge:true,
                    script:position.script,
                    kiteExpiryPrefix:position.kiteExpiryPrefix
                }]
            }
            else if(position.context.strikeAtm){
                requestOrders=[{
                    type:"BUY",
                    optionType:"CE",
                    strike:position.context.strikeAtm,
                    script:position.script,
                    kiteExpiryPrefix:position.kiteExpiryPrefix
                },{
                    type:"BUY",
                    optionType:"PE",
                    strike:position.context.strikeAtm,
                    script:position.script,
                    kiteExpiryPrefix:position.kiteExpiryPrefix
                }]
            }
            
            if(strategyConfig[strategyId]){
                console.log("Trading orders",strategyId,expiry,requestOrders)
                
                storedData.orderTimeline=storedData.orderTimeline||[]
                storedData.orderTimeline.push({timestamp:formatDateTime(new Date()),requestOrders,strategyId,expiry})
                await persist.set(storedData)
                await broker.order(strategyId,requestOrders,{sendMessage:async(error)=>{
                    console.log(strategyId,error)
                    storedData = await persist.get()
                    storedData.errors=storedData.errors||[]
                    storedData.errors.push({timestamp:formatDateTime(new Date()),error,strategyId,expiry})
                    await persist.set(storedData)
                }},expiry,(brokerName=="KITE"),(brokerName=="FIVEPAISA"),(brokerName=="FINVASIA"),(brokerName=="ANGEL"))
            }
        }
        catch(e){
            console.log(e)
        }
        finally{
            updateCallback()
        }
    },
    login
}

async function waitAWhile(time){
    return new Promise((resolve,reject)=>{
        setTimeout(resolve,time)
    })
    
}

async function login (updateCallback) {
    console.log("Connected to Server")
    socket.removeAllListeners();
    strategyConfig=await strategy.get()
    
    try{
        await angel.init();
        console.log("Angel Login Complete")
    }
    catch(e){
        console.log("Could not initialize angel",e)
    }

    try{
        await kite.init();
        console.log("Kite Login Complete")
    }
    catch(e){
        console.log("Could not initialize kite",e)
    }
    try{
        await fp.init();
        console.log("5Paisa Login Complete")
    }
    catch(e){
        console.log("Could not initialize 5Paisa",e)
    }
    try{
        await finvasia.init();
        console.log("Finvasia Login Complete")
    }
    catch(e){
        console.log("Could not initialize 5Paisa",e)
    }
    socket.on("disconnect", () => {
        console.log("Disconnected from server")
    });

    socket.on("kite-login",async request=>{
        const {requestToken}=request
        console.log("Kite login request",requestToken)
        const params = new URLSearchParams();
        params.append( 'api_key', process.env.KITE_API_KEY);
        params.append( 'request_token',requestToken);
        params.append( 'checksum',crypto.createHash('sha256').update(process.env.KITE_API_KEY+requestToken+process.env.KITE_API_SECRET).digest('hex'));
        const {status,data} = await (await fetch('https://api.kite.trade/session/token', {
              method: 'post',
              body:   params,
              headers: { 'X-Kite-Version': '3' },
        })).json()
        
        if(status=="success"){

            storedData = await persist.get()
            storedData["kite"]={user:data,requestToken}
            await persist.set(storedData)
            try{
                await kite.init();
                console.log("Kite Login Complete")
            }
            catch(e){
                console.log("Could not initialize kite",e)
            }
        }
        else{
            console.log(status,data)
        }
    })

    socket.on("kite-login-user",async request=>{

        storedData = await persist.get()
        storedData["kite"]=request
        await persist.set(storedData)
        try{
            await kite.init();
            console.log("Kite Login data received")
        }
        catch(e){
            console.log("Could not initialize kite",e)
        }
    })

    socket.on("kite-webhook",kite.post)

    socket.on("trade",async request=>{
        try{
            const {data}=request
            const {requestOrders,strategyId,expiry}=data
            console.log("Order for ",strategyId)
            strategyConfig=await strategy.get()
            if(strategyConfig[strategyId]){
                console.log("Trading orders",strategyId,expiry,requestOrders)
                storedData = await persist.get()
                storedData.orderTimeline=storedData.orderTimeline||[]
                storedData.orderTimeline.push({timestamp:formatDateTime(new Date()),requestOrders,strategyId,expiry})
                await persist.set(storedData)
                await broker.order(strategyId,requestOrders,{sendMessage:async(error)=>{
                    console.log(strategyId,error)
                    storedData = await persist.get()
                    storedData.errors=storedData.errors||[]
                    storedData.errors.push({timestamp:formatDateTime(new Date()),error,strategyId,expiry})
                    await persist.set(storedData)
                }},expiry)
            }
        }
        catch(e){
            console.log(e)
        }
        finally{
            updateCallback()
        }
    })

    socket.on("position",async request=>{
        try{
            const {data}=request
            const {position,strategyId,expiry}=data
            console.log("Position update for ",strategyId,"at",formatDateTime(new Date()))
            strategyConfig=await strategy.get()
            if(strategyConfig[strategyId]){
                storedData = await persist.get()
                storedData.position=storedData.position||{}
                storedData.position[strategyId]={position,timestamp:(new Date()).getTime(),expiry}
                await persist.set(storedData)
            }
        }
        catch(e){
            console.log(e)
        }
        finally{
            updateCallback()
        }
    })

    socket.emit("init",{userId:process.env.MY_TELEGRAM_ID})
    
}

function formatDateTime(date) {
    const dateArray = date.toLocaleString().split(",")
    const [month, day, year]=dateArray[0].trim().split("/")
    const [time, ampm]=dateArray[1].trim().split(" ")
    const [hour, mins,_]=time.split(":")
    return `${year}-${addZero(month)}-${addZero(day)} ${addZero(hour)}:${addZero(mins)}${ampm?ampm:''}`
}
function addZero(val){
    return val<10&&!val.startsWith("0")?"0"+val:val
}

