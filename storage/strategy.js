const fs = require("fs")
const strategies = require("./strategies.json")



function set(data){
    return new Promise((resolve,reject)=>{
        fs.writeFile(`${__dirname}/data/strategies.json`, JSON.stringify(data), function (err) {
            if (err) {
                return reject(err)
            }
            return resolve()
        });
    })
    
}

function get(){
    return new Promise((resolve,reject)=>{

        fs.readFile(`${__dirname}/data/strategies.json`, 'utf8', function(err, data){
            
            if (err) {
                return resolve({});
            }
            try{
                return resolve(JSON.parse(data));
            }
            catch(e){
                return resolve({});
            }
        });
    });
}


async function init(){
    let _savedStategies
    try{
        _savedStategies=await get()||strategies
    }
    catch(e){
        console.log(e)
    }

    if(_savedStategies&&JSON.stringify(_savedStategies)!==JSON.stringify({})){
        for(const strategyId of Object.keys(strategies)){
            if(!_savedStategies[strategyId]){
                _savedStategies[strategyId]=strategies[strategyId]
            }
            else{
                for(const brokerName of Object.keys(strategies[strategyId])){
                    if(!_savedStategies[strategyId][brokerName]){
                        _savedStategies[strategyId][brokerName]=strategies[strategyId][brokerName]
                    }
                }
            }
        }
        // console.log("saved strategies",_savedStategies)
        await set(_savedStategies)
    }
    else{
        // console.log("strategies",strategies)
        await set(strategies)
    }


}


module.exports={get,set,init}

