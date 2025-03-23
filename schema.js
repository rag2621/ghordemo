let mon =require("mongoose");

let sch= new mon.Schema({Username:String,Email:String,Pass:String});

module.exports=mon.model('User',sch);