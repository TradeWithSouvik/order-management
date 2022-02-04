const fs = require("fs")
let strategies = require("./strategies.json")

let storedData

function set(data){
    return new Promise((resolve,reject)=>{
        storedData=data
        resolve(storedData)
        fs.writeFile(`${process.cwd()}/data/strategies.json`, JSON.stringify(data), function (err) {
            if (err) {
                return reject(err)
            }
            return resolve()
        });
    })
    
}

function get(){
    return new Promise((resolve,reject)=>{
        if(storedData){
            return resolve(storedData)
        }
        else{
            fs.readFile(`${process.cwd()}/data/strategies.json`, 'utf8', function(err, data){
                
                try{
                    if(data){
                        return resolve(JSON.parse(data));
                    }
                }
                catch(e){
                    console.log(e)
                }
                return resolve({});
            });
        }
    });
}


async function init(){
    let _savedStategies

    var dir = `${process.cwd()}/data`;

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
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
        
        strategies=_savedStategies
       

    }

    Object.keys(process.env).forEach((key)=>{
        try{
            if(key.startsWith("STRATEGY__")&&key.endsWith("__QTY")){
                const [_,strategyName,brokerName,type]=key.split("__")
                if(type=="QTY"){
                    strategies[strategyName]=strategies[strategyName]||{}
                    strategies[strategyName][brokerName]=strategies[strategyName][brokerName]||{
                        "ORDER":false,
                        "HEDGE":true,
                        "QTY":parseInt(process.env[key])
                    }
                }
            }
        }
        catch(e){
            console.log(e)
        }
    })
    
    await set(strategies)


}


module.exports={get,set,init}

