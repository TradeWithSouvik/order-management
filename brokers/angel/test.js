

let { SmartAPI, WebSocketClient } = require("smartapi-javascript");
let fetch = require("node-fetch")

let smart_api = new SmartAPI({
    api_key: "Zu4yDcit",    // PROVIDE YOUR API KEY HERE
});
const instruments={}
;(async()=>{
    await smart_api.generateSession("S434315", "maadurga2013") 

    const insrumentData=(await (await fetch("https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json")).json())

    insrumentData
    .filter(_=>(_.name.startsWith("BANKNIFTY")||_.name.startsWith("NIFTY"))&&_.exch_seg=="NFO")
    .forEach(instrument=>instruments[instrument.name]=instrument)

    console.log(instruments)

    const [_,date,month,year] = expiry.toUpperCase().match("(..).(...)...(..)")
    const expiryPrefix = [date,month,year].join("")
    const tradingSymbol = `${order.script}${expiryPrefix}${order.strike}${order.optionType}`
    console.log(await smart_api.placeOrder({
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

})()
