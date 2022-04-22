require('dotenv').config()

let { SmartAPI, WebSocketClient } = require("smartapi-javascript");
const fetch = require("node-fetch")
const strategy = require("../../storage/strategy")
let strategyConfig

const persist = require("../../storage/persist")
let storedData
let smart_api


const instruments={}

module.exports={
    init:async()=>{
        if(process.env.ANGEL_API_KEY&&process.env.ANGEL_API_KEY!="undefined"&&process.env.ANGEL_API_KEY!=""){
            smart_api = new SmartAPI({
                api_key:process.env.ANGEL_API_KEY,    
            });
            
            await smart_api.generateSession(process.env.ANGEL_CLIENT_CODE, process.env.ANGEL_PASSWORD);

            const insrumentData=(await (await fetch("https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json")).json())
            insrumentData
            .filter(_=>(_.symbol.startsWith("BANKNIFTY")||_.symbol.startsWith("NIFTY"))&&_.exch_seg=="NFO")
            .forEach(instrument=>instruments[instrument.symbol]=instrument)

            storedData = await persist.get()
            storedData.angelLogin=true
            await persist.set(storedData)
        }
        else{
            throw "Angel creds not present"
        }
    },
    placeOrder:async(strategyId,orders,expiry)=>{
        const qty = await getQty(strategyId)
        let responses=[]
        const [_,date,month,year] = expiry.toUpperCase().match("(..).(...)...(..)")
        const expiryPrefix = [date,month,year].join("")
        for(const order of orders){
            const tradingSymbol = `${order.script}${expiryPrefix}${order.strike}${order.optionType}`
            try{
                responses.push(await smart_api.placeOrder({
                    "variety": "NORMAL",
                    "tradingsymbol": tradingSymbol,
                    "symboltoken": instruments[tradingSymbol].token,
                    "transactiontype": order.type,
                    "exchange": "NFO",
                    "ordertype": "MARKET",
                    "producttype": "INTRADAY",
                    "duration": "DAY",
                    "price": "0",
                    "squareoff": "0",
                    "stoploss": "0",
                    "quantity": qty
                })) 
            }
            catch(e){
                console.log("ANGEL ORDER ERROR",e)
                storedData=await persist.get()
                storedData.errors=storedData.errors||[]
                storedData.errors.push({timestamp:formatDateTime(new Date()),error:e.toString()+" Angel",strategyId})
                await persist.set(storedData)
            }

        }


        storedData=await persist.get()
        storedData.angelResponses=storedData.angelResponses||[]
        storedData.angelResponses.push({timestamp:formatDateTime(new Date()),responses,strategyId})
        await persist.set(storedData)



        return responses
        
    },
    short:async(script,expiry,qty)=>{
        const scriptMap={
            "NIFTY":50,
            "BANKNIFTY":25
        }
        let responses=[]
        const [_,date,month,year] = expiry.toUpperCase().match("(..).(...)...(..)")
        const expiryPrefix = [date,month,year].join("")
        const tradingSymbol = `${script}${expiryPrefix}FUT`
        try{
            responses.push(await smart_api.placeOrder({
                "variety": "NORMAL",
                "tradingsymbol": tradingSymbol,
                "symboltoken": instruments[tradingSymbol].token,
                "transactiontype": "SELL",
                "exchange": "NFO",
                "ordertype": "MARKET",
                "producttype": "INTRADAY",
                "duration": "DAY",
                "price": "0",
                "squareoff": "0",
                "stoploss": "0",
                "quantity": scriptMap[script]*parseInt(qty)
            })) 
        }
        catch(e){
            console.log("ANGEL ORDER ERROR",e)
        }
        return responses
        
    },
    long:async(script,expiry,qty)=>{
        const scriptMap={
            "NIFTY":50,
            "BANKNIFTY":25
        }
        let responses=[]
        const [_,date,month,year] = expiry.toUpperCase().match("(..).(...)...(..)")
        const expiryPrefix = [date,month,year].join("")
        const tradingSymbol = `${script}${expiryPrefix}FUT`
        try{
            responses.push(await smart_api.placeOrder({
                "variety": "NORMAL",
                "tradingsymbol": tradingSymbol,
                "symboltoken": instruments[tradingSymbol].token,
                "transactiontype": "BUY",
                "exchange": "NFO",
                "ordertype": "MARKET",
                "producttype": "INTRADAY",
                "duration": "DAY",
                "price": "0",
                "squareoff": "0",
                "stoploss": "0",
                "quantity": scriptMap[script]*parseInt(qty)
            })) 
        }
        catch(e){
            console.log("ANGEL ORDER ERROR",e)
        }
        return responses
        
    }
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
async function getQty(strategyId){
    strategyConfig=await strategy.get()
    return strategyConfig[strategyId].ANGEL.QTY
}

