var socket = io(window.location.origin);
var app = new Vue({
    el: '#app',
    data: {
        creds:{},
        loader:true,
        password:""
    },
    methods: {
        init:function(){
            this.password=this.findGetParameter("password")
            socket.on("creds",(data)=>{
                this.loader=false
                this.creds=data
            })
            socket.emit("creds",{password:this.password})
            this.loader=true
           
        },
        login:function(){
            socket.on("login",()=>{
                this.loader=false
            })
            socket.emit("login",{password:this.password})
            this.loader=true
          
        },
        save:function(){
            socket.on("set_creds",()=>{
                this.loader=false
            })
            socket.emit("set_creds",{data:this.creds,password:this.password})
            this.loader=true
          
        },
        findGetParameter:function(parameterName){
            var result = null,
                tmp = [];
            location.search
                .substr(1)
                .split("&")
                .forEach(function (item) {
                  tmp = item.split("=");
                  if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
                });
            return result;
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
