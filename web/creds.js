var socket = io(window.location.origin);
var app = new Vue({
    el: '#app',
    data: {
        creds:{},
        loader:true,
    },
    methods: {
        init:function(){
            socket.on("creds",(data)=>{
                this.loader=false
                this.creds=data
            })
            socket.emit("creds",{})
            this.loader=true
           
        },
        login:function(){
            socket.on("login",()=>{
                this.loader=false
            })
            socket.emit("login",{})
            this.loader=true
          
        },
        save:function(){
            socket.on("set_creds",()=>{
                this.loader=false
            })
            socket.emit("set_creds",this.creds)
            this.loader=true
          
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
