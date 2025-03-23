let mon =require("mongoose");

let sch= new mon.Schema({Title:String,Type:String,Bed:String,Bath:String,Loaction:String,Images:Array,Description:String,Area:Number});

module.exports=mon.model('Upload',sch);