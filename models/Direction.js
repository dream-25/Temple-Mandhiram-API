const mongoose=require("mongoose");
const { Schema } = mongoose;

const DirectionSchema = new Schema({

  from:{
    type:String,
    required:true,
  },
  to:{
    type:String,
    required:true,
  },
  steps:{
    type:Array ,
    default:[]
  },
  
});
const Direction = mongoose.model("direction",DirectionSchema);
module.exports = Direction;