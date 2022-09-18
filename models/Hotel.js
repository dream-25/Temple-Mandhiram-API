const mongoose=require("mongoose");
const { Schema } = mongoose;

const HotelSchema = new Schema({

  templeId:{
    type:String,
    required:true,
  },
  name:{
    type:String,
    required:true,
  },
  description:{
    type:String,
    required:true,
  },
  image:{
    type:String ,
    required:true
  },
  templeName:{
    type:String,
    required:true
  }

  
});
const Hotel = mongoose.model("hotel",HotelSchema);
module.exports = Hotel;