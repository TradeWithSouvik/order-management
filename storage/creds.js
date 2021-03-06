const fs = require("fs")
let {FIVEPAISA_CREDS,
FIVEPAISA_APPSOURCE,
FIVEPAISA_APPNAME,
FIVEPAISA_USERID,
FIVEPAISA_PASSWORD,
FIVEPAISA_USERKEY,
FIVEPAISA_ENCRYPTIONKEY,
FINVASIA_UID,
FINVASIA_PASSWORD,
FINVASIA_DOB,
FINVASIA_API_KEY,
FINVASIA_IMEI,
KITE_API_KEY,
KITE_API_SECRET,
ANGEL_API_KEY,
ANGEL_CLIENT_CODE,
ANGEL_PASSWORD,
MY_TELEGRAM_ID} = process.env
let creds= {FIVEPAISA_CREDS,
    FIVEPAISA_APPSOURCE,
    FIVEPAISA_APPNAME,
    FIVEPAISA_USERID,
    FIVEPAISA_PASSWORD,
    FIVEPAISA_USERKEY,
    FIVEPAISA_ENCRYPTIONKEY,
    FINVASIA_UID,
    FINVASIA_PASSWORD,
    FINVASIA_DOB,
    FINVASIA_API_KEY,
    FINVASIA_IMEI,
    KITE_API_KEY,
    KITE_API_SECRET,
    ANGEL_API_KEY,
    ANGEL_CLIENT_CODE,
    ANGEL_PASSWORD,
    MY_TELEGRAM_ID} 
let storedData




function set(data){
    return new Promise((resolve,reject)=>{
        storedData=data

        for(const key of Object.keys(data)){
            if(data[key]==undefined){
                delete data[key]
            }
            process.env[key]=data[key]
        }
        resolve(storedData)
        fs.writeFile(`${process.cwd()}/data/creds.json`, JSON.stringify(data), function (err) {
            if (err) {
                console.log(err)
            }
                      
        });
    })
    
}

function get(){
    return new Promise((resolve,reject)=>{
        if(storedData){
            return resolve(storedData)
        }
        else{
            fs.readFile(`${process.cwd()}/data/creds.json`, 'utf8', function(err, data){
                
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
    let _savedCreds

    var dir = `${process.cwd()}/data`;

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    try{
        _savedCreds=await get()||creds
    }
    catch(e){
        console.log(e)
    }

    if(_savedCreds){
        for(const key of Object.keys(creds)){
            _savedCreds[key]=_savedCreds[key]||creds[key]
            if(_savedCreds[key]==undefined){
                delete _savedCreds[key]
            }
            process.env[key]=_savedCreds[key]
        }
        await set(_savedCreds)
    }
    else{
        await set(creds)
    }


}


module.exports={get,set,init}

