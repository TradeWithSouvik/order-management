

const strategy = require("../../storage/strategy")
let strategyConfig
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
        strategyConfig=await strategy.get()
        return strategyConfig[strategyId].FINVASIA.QTY
    }
}





 