// Configuration for your app
require('dotenv').config()
const strategy = require("../../storage/strategy")
let strategyConfig

const persist = require("../../storage/persist")


const { FivePaisaClient } = require("./5paisajs/index.js")

var client
let loginCred 
let storedData



function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('');
}


async function init(){
    const conf = {
        "appSource": process.env.FIVEPAISA_APPSOURCE,
        "appName": process.env.FIVEPAISA_APPNAME,
        "userId": process.env.FIVEPAISA_USERID,
        "password": process.env.FIVEPAISA_PASSWORD,
        "userKey": process.env.FIVEPAISA_USERKEY,
        "encryptionKey": process.env.FIVEPAISA_ENCRYPTIONKEY
    }
    const creds=process.env.FIVEPAISA_CREDS.split(",")
    
    if(conf.userId&&conf.password&&conf.userId!="undefined"&&conf.userId!=""){
        client = new FivePaisaClient(conf)
        loginCred = await client.login(...creds)
        await client.init(loginCred)
        storedData = await persist.get()
        storedData.fpLogin=true
        await persist.set(storedData)
    }
    else {
        throw "Fivepaisa creds not present"
    }
}

async function placeOrder(strategyId,orders,expiry){

    const expiryCap=expiry.toUpperCase().replace(/-/g," ")
    const expiryDate=new Date(expiryCap)
    const responses=[]
    if(orders.length>0){

        const data =(await client.getMarketFeed(orders.map(order=>{
            return {
                "Exch":"N",
                "ExchType":"D",
                "Symbol":`${order.script} ${expiryCap} ${order.optionType} ${order.strike.toString()}.00`,
                "Expiry":`${formatDate(expiryDate)}`,
                "StrikePrice":order.strike.toString(),
                "OptionType":order.optionType
            }
        })))

        
        if(data.length!==orders.length){
            throw "Could not fetch data"
        }
        let i=0
        const qty = await getQty(strategyId)
        for(const _ of data){
            const resp=await client.placeOrder(orders[i].type, _.Token, qty, "N", {
                exchangeSegment: "D",
                atMarket: true,
                isStopLossOrder: false,
                stopLossPrice: 0,
                isVTD: false,
                isIOCOrder: false,
                isIntraday: false,
                ahPlaced: "N",
                IOCOrder: false,
                price: 0
            })
            responses.push(resp)
            i++;
        }
        storedData=await persist.get()
        storedData.fpResponses=storedData.fpResponses||[]
        storedData.fpResponses.push({timestamp:formatDateTime(new Date()),responses,strategyId})
        await persist.set(storedData)
    }
    return responses
    
}


async function getQty(strategyId){
    strategyConfig=await strategy.get()
    return strategyConfig[strategyId].FIVEPAISA.QTY
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


async function long(script,expiry,qty){
    const scriptMap={
        "NIFTY":50,
        "BANKNIFTY":25
    }

    const expiryCap=expiry.toUpperCase().replace(/-/g," ")
    const expiryDate=new Date(expiryCap)
    const data = (await client.getMarketFeed([ 
    {   
        "Exch": "N",
        "ExchType": "D",
        "Symbol": `${script} ${expiryCap}`,
        "Expiry": `${formatDate(expiryDate)}`,
        "StrikePrice": "0",
        "OptionType": "XX" 
    }]))
    if(data.length!==1){ throw "Could not fetch data" }
    let _ = data[0]
    return await client.placeOrder("BUY", _.Token, scriptMap[script]*Math.abs(parseInt(qty)), "N", {
        exchangeSegment: "D",
        atMarket: true,
        isStopLossOrder: false,
        stopLossPrice: 0,
        isVTD: false,
        isIOCOrder: false,
        isIntraday: false,
        ahPlaced: "N",
        IOCOrder: false,
        price: 0
    })
}

async function short(script,expiry,qty){
    const scriptMap={
        "NIFTY":50,
        "BANKNIFTY":25
    }

    const expiryCap=expiry.toUpperCase().replace(/-/g," ")
    const expiryDate=new Date(expiryCap)
    const data = (await client.getMarketFeed([ 
    {   
        "Exch": "N",
        "ExchType": "D",
        "Symbol": `${script} ${expiryCap}`,
        "Expiry": `${formatDate(expiryDate)}`,
        "StrikePrice": "0",
        "OptionType": "XX" 
    }]))
    if(data.length!==1){ throw "Could not fetch data" }
    let _ = data[0]
    return await client.placeOrder("SELL", _.Token,scriptMap[script]*Math.abs(parseInt(qty)), "N", {
        exchangeSegment: "D",
        atMarket: true,
        isStopLossOrder: false,
        stopLossPrice: 0,
        isVTD: false,
        isIOCOrder: false,
        isIntraday: false,
        ahPlaced: "N",
        IOCOrder: false,
        price: 0
    })
}

module.exports.init=init
module.exports.long=long
module.exports.short=short
module.exports.placeOrder=placeOrder




