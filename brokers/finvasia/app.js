const Api = require("./lib/RestApi");
const strategyConfig = require("../../strategy.json")

const persist = require("../../storage/persist")
let storedData
let authparams  = {
    'userid'   : process.env.FINVASIA_UID,
    'password' : process.env.FINVASIA_PASSWORD,
    'twoFA'    :  process.env.FINVASIA_DOB,
    'vendor_code' : `${process.env.FINVASIA_UID}_U`,
    'api_secret' :  process.env.FINVASIA_API_KEY,
    'imei'       : process.env.FINVASIA_IMEI
}

let api = new Api({});

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
    init:async()=>{
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
    },
    placeOrder:async(strategyId,orders,expiry)=>{
        const qty = await getQty(strategyId)
        let responses=[]
        const [_,date,month,year] = expiry.toUpperCase().match("(..).(...)...(..)")
        console.log([date,month,year].join(""))
        const expiryPrefix = [date,month,year].join("")
        for(const order of orders){
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

            storedData=await persist.get()
            storedData.fvResponses=storedData.fvResponses||[]
            storedData.fvResponses.push({timestamp:formatDateTime(new Date()),responses,strategyId})
            await persist.set(storedData)
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
    return strategyConfig[strategyId].FINVASIA_ORDER_QTY
}

