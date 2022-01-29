

const strategy = require("../../storage/strategy")
let strategyConfig
const angel = require("./app")
let isFailing=false;
module.exports={
    order:async (strategyId, request)=>{
        if(isFailing){
            throw "Orders have failed previously hence the no order is being placed. Please fix the issue and restart the app."
        }
        let responseArray=await angel.placeOrder(strategyId, request.orders,request.expiry)
        console.log(responseArray)
    },
    getQty:async(strategyId)=>{
        strategyConfig=await strategy.get()
        return strategyConfig[strategyId].ANGEL.QTY
    }
}





 