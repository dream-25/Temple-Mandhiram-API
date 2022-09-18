const mongoose=require("mongoose");
const { Schema } = mongoose;

const TempleSchema = new Schema({

 name:{
    type:String,
    required:true,
    unique:true
 },
 location:{
    type:String ,
    required:true
 },
 title:{
   type:String ,
   required:true
},
 description:{
    type:String ,
    required:true
 },
 image:{
    type:String,
    required:true
 } ,
 openingTime:{
    type:Number,
    required:true
 },
 closingTime:{
    type:Number,
    required:true
 },
 events:{
   type:Array,
   default:[]
 },
 hotels:{
   type:Array,
   default:[]
 }
  
});
const Temple = mongoose.model("temple",TempleSchema);
module.exports = Temple;