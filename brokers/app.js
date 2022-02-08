
const kiteOrder = require("./kite/placeOrder")
const fpOrder = require("./5paisa/placeOrder")
const fvOrder = require("./finvasia/placeOrder")
const angelOrder = require("./angel/placeOrder")
const strategy = require("../storage/strategy")
let strategyConfig

module.exports.order=order



async function order(strategyId,requestOrders,bot,expiry,tradeInKite=true,tradeInFp=true,tradeInFinvasia=true,tradeInAngel=true){
    
    strategyConfig=await strategy.get()

    if(strategyConfig[strategyId].ANGEL&&strategyConfig[strategyId].ANGEL.ORDER&&tradeInAngel){
        

        setTimeout(async()=>{
            try{
                let hedgeStatus = strategyConfig[strategyId].ANGEL.HEDGE
                let requestOrdersBuy=requestOrders.filter(leg=>leg.type==="BUY")
                let requestOrdersSell=requestOrders.filter(leg=>leg.type==="SELL")
                if(!hedgeStatus){
                    requestOrdersBuy=requestOrdersBuy.filter(leg=>leg.isHedge!=true)
                    requestOrdersSell=requestOrdersSell.filter(leg=>leg.isHedge!=true)
                }
                const requestDataBuy={
                    orders:requestOrdersBuy,expiry
                }
                const requestDataSell={
                    orders:requestOrdersSell,expiry
                }
                await angelOrder.order(strategyId,requestDataBuy)
                await angelOrder.order(strategyId,requestDataSell)
                
            }
            catch(e){
                let err=e
                bot.sendMessage(`Error in Placing Angel Order ${err.toString()}`)
            }

        },0)
        
        console.log("::TRIED TO PLACE A TRADE IN ANGEL::")
    }
    if(strategyConfig[strategyId].FINVASIA&&strategyConfig[strategyId].FINVASIA.ORDER&&tradeInFinvasia){
        

        setTimeout(async()=>{
            try{
                let hedgeStatus = strategyConfig[strategyId].FINVASIA.HEDGE
                let requestOrdersBuy=requestOrders.filter(leg=>leg.type==="BUY")
                let requestOrdersSell=requestOrders.filter(leg=>leg.type==="SELL")
                if(!hedgeStatus){
                    requestOrdersBuy=requestOrdersBuy.filter(leg=>leg.isHedge!=true)
                    requestOrdersSell=requestOrdersSell.filter(leg=>leg.isHedge!=true)
                }
                const requestDataBuy={
                    orders:requestOrdersBuy,expiry
                }
                const requestDataSell={
                    orders:requestOrdersSell,expiry
                }
                await fvOrder.order(strategyId,requestDataBuy)
                await fvOrder.order(strategyId,requestDataSell)
                
            }
            catch(e){
                let err=e
                bot.sendMessage(`Error in Placing Finvasia Order ${err.toString()}`)
            }

        },0)
        
        console.log("::TRIED TO PLACE A TRADE IN FINVASIA::")
    }
    if(strategyConfig[strategyId].FIVEPAISA&&strategyConfig[strategyId].FIVEPAISA.ORDER&&tradeInFp){
        

        setTimeout(async()=>{
            try{
                let hedgeStatus = strategyConfig[strategyId].FIVEPAISA.HEDGE
                let requestOrdersBuy=requestOrders.filter(leg=>leg.type==="BUY")
                let requestOrdersSell=requestOrders.filter(leg=>leg.type==="SELL")
                if(!hedgeStatus){
                    requestOrdersBuy=requestOrdersBuy.filter(leg=>leg.isHedge!=true)
                    requestOrdersSell=requestOrdersSell.filter(leg=>leg.isHedge!=true)
                }
                const requestDataBuy={
                    orders:requestOrdersBuy,expiry
                }
                const requestDataSell={
                    orders:requestOrdersSell,expiry
                }
                await fpOrder.order(strategyId,requestDataBuy)
                await fpOrder.order(strategyId,requestDataSell)
                
            }
            catch(e){
                let err=e
                bot.sendMessage(`Error in Placing 5paisa Order ${err.toString()}`)
            }

        },0)
        
        console.log("::TRIED TO PLACE A TRADE IN 5PAISA::")
    }
    if(strategyConfig[strategyId].KITE&&strategyConfig[strategyId].KITE.ORDER&&tradeInKite){

        setTimeout(async()=>{
            try{
                let hedgeStatus = strategyConfig[strategyId].KITE.HEDGE
                let requestOrdersBuy=requestOrders.filter(leg=>leg.type==="BUY")
                let requestOrdersSell=requestOrders.filter(leg=>leg.type==="SELL")
                if(!hedgeStatus){
                    requestOrdersBuy=requestOrdersBuy.filter(leg=>leg.isHedge!=true)
                    requestOrdersSell=requestOrdersSell.filter(leg=>leg.isHedge!=true)
                }
                const requestDataBuy={
                    orders:requestOrdersBuy,expiry
                }
                const requestDataSell={
                    orders:requestOrdersSell,expiry
                }
                await kiteOrder.order(strategyId,[requestDataBuy,requestDataSell],bot)
            }
            catch(e){
                bot.sendMessage(`Error in Placing kite Order ${e}`)
            }

        },0)
        
        console.log("::TRIED TO PLACE A TRADE IN KITE::")
    }
}