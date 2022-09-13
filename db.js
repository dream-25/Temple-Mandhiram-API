const mongoose = require("mongoose");

// const  mongoURI = "mongodb://localhost:27017/temple";
const  mongoURI = "mongodb://templeAdmin:sbs02@178.128.154.246:25050/temple";


const connectToMongo = async ()=>{
    try {
        await mongoose.connect(mongoURI);
        console.log("connected to mongo successfully")
    } catch (error) {
        console.log(error);
    }
}

module.exports= connectToMongo ;