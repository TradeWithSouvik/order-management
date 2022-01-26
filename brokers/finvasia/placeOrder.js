
const strategyConfig = require("../../strategy.json")
const fv = require("./app")
let isFailing=false;
module.exports={
    order:async (strategyId, request)=>{
        if(isFailing){
            throw "Orders have failed previously hence the no order is being placed. Please fix the issue and restart the app."
        }
        let responseArray=await fv.placeOrder(strategyId, request.orders,request.expiry)
    },
    getQty:async(strategyId)=>{
            return strategyConfig[strategyId].FINVASIA_ORDER_QTY
    }
}





 