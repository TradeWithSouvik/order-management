var socket = io(window.location.origin);
var app = new Vue({
    el: '#app',
    data: {
        data:{},
        orders:[],
        kiteResponses:[],
        fpResponses:[],
        fvResponses:[],
        angelResponses:[],
        strategies:[],
        loader:false,
        kiteKey:"",
    },
    methods: {
        init:function(){
            setInterval(()=>{
              if(this.data&&this.data.position){
                for(const strategyId of Object.keys(this.data.position)){
                  this.isSynced(strategyId)
                }
              }
            },500)
            socket.on("data",(data)=>{
              console.log(data)
                this.data=data.data
                this.kiteKey=data.kiteKey
                this.orders=[]
                this.strategies=[]
                
                try{
                  if(data.strategies){
                    Object.keys(data.strategies).forEach(id=>{
                      
                      Object.keys(data.strategies[id]).forEach(brokerName=>{
                          const el= data.strategies[id][brokerName]
                          el.strategyId=id
                          el.brokerName=brokerName
                          this.strategies.push(el)
                          this.isSynced(id)
                      })
                    })
                    // this.strategies.sort((a,b)=>-a.ORDER+b.ORDER)
                  
                  }
                }
                catch(e){
                  console.log("strategy error",e)
                }
                try{
                  if(this.data.orderTimeline){
                    this.data.orderTimeline.forEach(el=>{
                        el.requestOrders.forEach(order=>{
                            order.timestamp=el.timestamp
                            order.strategyId=el.strategyId
                            order.expiry=el.expiry
                            this.orders.push(order)
                        })
                    })
                    this.orders=this.orders.reverse()
                  }
                }
                catch(e){
                  console.log("orders error",e)
                }

                this.kiteResponses=[]
                try{
                  if(this.data.kiteResponses){
                    this.data.kiteResponses.forEach(el=>{
                        el.responses.forEach(order=>{
                            order={orderId:order.response.order_id}
                            order.time=el.timestamp
                            order.strategyId=el.strategyId
                            this.kiteResponses.push(order)
                        })
                    })
                    this.kiteResponses=this.kiteResponses.reverse()
                  }
                }
                catch(e){
                  console.log("kite error",e)
                }
                this.fpResponses=[]
                try{
                  if(this.data.fpResponses){
                    this.data.fpResponses.forEach(el=>{
                        el.responses.forEach(order=>{
                            order.time=el.timestamp
                            order.strategyId=el.strategyId
                            this.fpResponses.push(order)
                        })
                    })
                    this.fpResponses=this.fpResponses.reverse()
                  }
                }
                catch(e){
                  console.log("fp error",e)
                }

                this.fvResponses=[]
                try{
                  if(this.data.fvResponses){
                    this.data.fvResponses.forEach(el=>{
                        el.responses.forEach(order=>{
                            order.time=el.timestamp
                            order.strategyId=el.strategyId
                            this.fvResponses.push(order)
                        })
                    })
                    this.fvResponses=this.fvResponses.reverse()
                  }
                }
                catch(e){
                  console.log("fp error",e)
                }

                this.angelResponses=[]
                try{
                  if(this.data.angelResponses){
                    this.data.angelResponses.forEach(el=>{

                        el.responses.forEach(order=>{
                            let error = order.errorcode
                            let message = order.message
                            order=order.data
                            order.error=error
                            order.message=message
                            order.time=el.timestamp
                            order.strategyId=el.strategyId
                            this.angelResponses.push(order)
                        })
                    })
                    this.angelResponses=this.angelResponses.reverse()
                  }
                }
                catch(e){
                  console.log("fp error",e)
                }

            })
            
           
        },
        redirectToKiteLogin:function(){
          // console.log(this.kiteKey)
          window.open(`https://kite.trade/connect/login?api_key=${this.kiteKey}&v=3`, "_blank");
        },
        changeSettings:function(type,strategyId,brokerName,index,value){
          socket.on("change",()=>{
            this.strategies[index][type]=value
            this.loader=false
            if(type!="ORDER"){
              // this.strategies.sort((a,b)=>-a.ORDER+b.ORDER)
            }
          })
          this.loader=true
          socket.emit("change",{type,strategyId,brokerName,value})
        },
        enter:function(strategyId,brokerName){
          socket.on("enter",()=>{
            this.loader=false
          })
          this.loader=true
          socket.emit("enter",{strategyId,brokerName})
        },
        exit:function(strategyId,brokerName){
          socket.on("exit",()=>{
            this.loader=false
          })
          this.loader=true
          socket.emit("exit",{strategyId,brokerName})
        },
        isSynced:function(strategyId){  
          if(this.data.position&&this.data.position[strategyId]){
            let  validTillInMs = new Date(this.data.position[strategyId].timestamp)
            validTillInMs.setSeconds(0)
            validTillInMs = new Date((validTillInMs.getTime()+60*1000)).getTime()
            if(this.data.position[strategyId]){
              if((validTillInMs-new Date().getTime())>500){
                this.strategies=this.strategies.map((_)=>{
                  if(_.strategyId==strategyId){ 
                    _.resyncInTime=Math.round((validTillInMs+500-new Date().getTime())/1000)
                    _.isNotSynced=false
                  }
                  return _
                })
                return
              }
            }
            this.strategies=this.strategies.map((_)=>{
              if(_.strategyId==strategyId){
                _.resyncInTime=-1
                _.isNotSynced=true
              }
              return _
            })
          }
          else{
            this.strategies=this.strategies.map((_)=>{
              if(_.strategyId==strategyId){
                _.resyncInTime=-1
                _.isNotSynced=true
              }
              return _
            })
          }

        }
    },
    watch:{
      data: {
            handler: function (val) {
               localStorage.setItem("data",val)
            },
            deep: true
        }
    },
    mounted(){

        document.getElementById("app").style.display="block";
        this.init()
    }
})
