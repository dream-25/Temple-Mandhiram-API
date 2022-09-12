const mongoose = require("mongoose");
const { Schema } = mongoose;

const TempleEventsSchema = new Schema({
    templeId: {
        type: String,
        required: true
    },
    date: {
        type: Number,
        required: true,
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    openingTime: {
        type: Number,
        required: true
    },
    closingTime: {
        type: Number,
        required: true
    },



});
const TempleEvents = mongoose.model("templeEvents", TempleEventsSchema);
module.exports = TempleEvents;