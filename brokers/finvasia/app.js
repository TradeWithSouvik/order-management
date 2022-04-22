const Api = require("./lib/RestApi");
const strategy = require("../../storage/strategy")
let strategyConfig

const persist = require("../../storage/persist")
let storedData

let api

function receiveQuote(data) {
    console.log("Quote ::", data);
}

function receiveOrders(data) {
    console.log("Order ::", data);
}
function open(data) {
    console.log("Finvasia socket open",data)
}

module.exports={
    long:async(script,expiry,qty)=>{
        const scriptMap={
            "NIFTY":50,
            "BANKNIFTY":25
        }
        
        

        let responses=[]
        const [_,date,month,year] = expiry.toUpperCase().match("(..).(...)...(..)")
        const expiryPrefix = [date,month,year].join("")
            try{
                responses.push(await api.place_order({
                    'buy_or_sell' : `B`,
                    'product_type' : 'M',
                    'exchange' : 'NFO',
                    'tradingsymbol'  :  `${script}${expiryPrefix}F`,
                    'quantity' : scriptMap[script]*parseInt(qty),
                    'discloseqty' : 0,
                    'price_type' : 'MKT',
                    'price' : 0
                })) 
            
            }
            catch(e){
                console.log("FINVAISA ORDER ERROR",e)
                if(typeof e=="object"){
                    e=JSON.stringify(e)
                }                                  
            }

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
            try{
                responses.push(await api.place_order({
                    'buy_or_sell' : `S`,
                    'product_type' : 'M',
                    'exchange' : 'NFO',
                    'tradingsymbol'  :  `${script}${expiryPrefix}F`,
                    'quantity' : scriptMap[script]*parseInt(qty),
                    'discloseqty' : 0,
                    'price_type' : 'MKT',
                    'price' : 0
                })) 
            
            }
            catch(e){
                console.log("FINVAISA ORDER ERROR",e)
                if(typeof e=="object"){
                    e=JSON.stringify(e)
                }                      
            }

        return responses
    },
    init:async()=>{
        let authparams  = {
            'userid'   : process.env.FINVASIA_UID,
            'password' : process.env.FINVASIA_PASSWORD,
            'twoFA'    :  process.env.FINVASIA_DOB,
            'vendor_code' : `${process.env.FINVASIA_UID}_U`,
            'api_secret' :  process.env.FINVASIA_API_KEY,
            'imei'       : process.env.FINVASIA_IMEI
        }
        
        if(process.env.FINVASIA_UID&&process.env.FINVASIA_UID!="undefined"&&process.env.FINVASIA_UID!=""){
            api  = new Api({});
            await api.login(authparams)
            params = {
            'socket_open' : open,
            'quote' : receiveQuote,   
            'order' : receiveOrders       
            }
            api.start_websocket(params);
            storedData = await persist.get()
            storedData.fvLogin=true
            await persist.set(storedData)
        }
        else{
            throw "Finvaisa creds not present"
        }
    },
    placeOrder:async(strategyId,orders,expiry)=>{
        const qty = await getQty(strategyId)
        let responses=[]
        const [_,date,month,year] = expiry.toUpperCase().match("(..).(...)...(..)")
        const expiryPrefix = [date,month,year].join("")
        for(const order of orders){
            try{
                responses.push(await api.place_order({
                    'buy_or_sell' : `${order.type[0]}`,
                    'product_type' : 'M',
                    'exchange' : 'NFO',
                    'tradingsymbol'  :  `${order.script}${expiryPrefix}${order.optionType[0]}${order.strike}`,
                    'quantity' : qty,
                    'discloseqty' : 0,
                    'price_type' : 'MKT',
                    'price' : 0
                })) 
            
            }
            catch(e){
                console.log("FINVAISA ORDER ERROR",e)
                storedData=await persist.get()
                storedData.errors=storedData.errors||[]
                storedData.errors.push({timestamp:formatDateTime(new Date()),error:e.toString()+" Finvasia",strategyId})
                await persist.set(storedData)
            }

        }
        storedData=await persist.get()
        storedData.fvResponses=storedData.fvResponses||[]
        storedData.fvResponses.push({timestamp:formatDateTime(new Date()),responses,strategyId})
        await persist.set(storedData)
    


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
    return strategyConfig[strategyId].FINVASIA.QTY
}

