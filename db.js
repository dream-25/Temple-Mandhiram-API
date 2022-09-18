const mongoose = require("mongoose");

const  mongoURI = "mongodb://templeAdmin:sbs02@178.128.154.246:25050/temple";
// const mongoURI = "mongodb+srv://iNotebook:rbha1995@cluster0.kj9x8.mongodb.net/temple?retryWrites=true&w=majority"


const connectToMongo = async ()=>{
    try {
        await mongoose.connect(mongoURI);
        console.log("connected to mongo successfully")
    } catch (error) {
        console.log(error);
    }
}

module.exports= connectToMongo ;