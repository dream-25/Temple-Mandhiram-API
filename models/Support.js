const mongoose=require("mongoose");
const { Schema } = mongoose;

const SupportSchema = new Schema({

  name:{
    type:String,
    required:true,
  },
  phone:{
    type:String,
    required:true,
  },
  query:{
    type:String ,
    required:true
  },
  pending:{
    type:Boolean,
    default:true
  }
  
  
});
const Support = mongoose.model("support",SupportSchema);
module.exports = Support;