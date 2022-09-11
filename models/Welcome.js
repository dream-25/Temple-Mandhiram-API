const mongoose=require("mongoose");
const { Schema } = mongoose;

const WelcomeSchema = new Schema({

 heading:{
    type:String,
    required:true
 },
 description:{
    type:String ,
    required:true
 },
 image:{
    type:String,
    required:true
 }
  
});
const Welcome = mongoose.model("welcome",WelcomeSchema);
module.exports = Welcome;