const fs = require("fs")

let storedData

function formatDate(date) {
    const dateArray = date.toLocaleString().split(",")
    const [month, day, year]=dateArray[0].trim().split("/")
    return `${year}-${addZero(month)}-${addZero(day)}`
}
function addZero(val){
    return val<10&&!val.startsWith("0")?"0"+val:val
}
module.exports.set=(data)=>{
    return new Promise((resolve,reject)=>{
        storedData=data
        resolve(storedData)
        var dir = `${process.cwd()}/data`;

        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        fs.writeFile(`${process.cwd()}/data/${formatDate(new Date())}.json`, JSON.stringify(data), function (err) {
            if (err) {
                console.log(err)
            }
        });
    })
    
}

module.exports.get=()=>{
    return new Promise((resolve,reject)=>{
        if(storedData){
            return resolve(storedData)
        }
        else{
            var dir = `${process.cwd()}/data`;

            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
            fs.readFile(`${process.cwd()}/data/${formatDate(new Date())}.json`, 'utf8', function(err, data){
                
                
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