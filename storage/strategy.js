const fs = require("fs")
const strategies = require("./strategies.json")

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
                        data=JSON.parse(data)
                        
                        
                        return resolve(data);
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
        

        Object.keys(process.env).forEach((key)=>{
            try{
                console.log(key)
                if(key.startsWith("STRATEGY__")&&key.endsWith("__QTY")){
                    const [_,strategyName,brokerName,type]=key.split("__")
                    if(type=="QTY"){
                        data[strategyName]=data[strategyName]||{}
                        data[strategyName][brokerName]=data[strategyName][brokerName]||{
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

        await set(_savedStategies)
    }
    else{

        Object.keys(process.env).forEach((key)=>{
            try{
                console.log(key)
                if(key.startsWith("STRATEGY__")&&key.endsWith("__QTY")){
                    const [_,strategyName,brokerName,type]=key.split("__")
                    if(type=="QTY"){
                        data[strategyName]=data[strategyName]||{}
                        data[strategyName][brokerName]=data[strategyName][brokerName]||{
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


}


module.exports={get,set,init}

