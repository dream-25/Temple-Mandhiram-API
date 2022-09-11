const mongoose=require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
  
  phone:{
    type:String,
    required:true
  },
  name:{
    type:String ,
    required:true
  },
  image:{
    type:String,
    default:""
  },
  birthDate:{
    type:Date,
    required:true
  },
  password:{
    type:String,
    required:true
  },
  isVerified:{
    type:Boolean,
    default:false
  },
  
  date:{
    type:Date,
    default:Date.now
  }
  
});
const User = mongoose.model("user",UserSchema);
module.exports = User;