const express = require("express");
const router = express.Router();
const Direction = require("../models/Direction");
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const fetchapp = require("../middlewares/fetchapp");
const fetchuser = require("../middlewares/fetchuser");
const fs = require('fs');
const { uploadFile, deleteFile, updateFile } = require("../utilities/awsS3")

//multer setup start ---------------------------------------------------

const multer = require('multer');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})


const upload = multer({ storage: storage })
// multer part end --------------------


// add a direction
router.post("/add" , fetchapp , upload.any() , async(req , res)=>{
    let success = false;
    const {from , to , steps} = req.body;
    try {
      const app = req.app;
      //  create a new direction
      let direction = await Direction.create({
        from: from,
        to: to,
        steps: steps.split(","),
    }) 
    success = true;
    return res.json({success , message:"Direction added successfully"})
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success, message: "Internal server error" });
    }
})

// fetch all direction
router.get("/fetchall" , fetchapp , async(req , res)=>{
    let success = false;
    try {
      const app = req.app;
      // finding all direction
      let directions = await Direction.find();
      success = true;
      return res.json({success , message:directions})
        
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success, message: "Internal server error" });
    }
})

// fetch location specific direction
router.get("/fetch" , fetchapp  , async(req , res)=>{
    let success = false;
    const {from ,to} = req.query;
    try {
      const app = req.app;
      let directions;
      // finding directions
      if(from && to){
        directions = await Direction.find({$and:[{from:from},{to:to}]});
      }
      else if(from){
        directions = await Direction.find({from:from});
      }
      else if(to){
        directions = await Direction.find({to:to});
      }
      else{
        directions = await Direction.find();
      }
      success = true;
      return res.json({success , message:directions})
        
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success, message: "Internal server error" });
    }
})

// update a direction
router.put("/update/:id" , fetchapp , upload.any() , async(req , res)=>{
  let success = false;
  let {steps} = req.body;
  const {id} = req.params;
  try {
    const app = req.app;
    // checking if the direction is exists or not
    let direction = await Direction.findById(id);
    if(!direction){
      return res.status(404).json({success , message:"Direction not found"})
    }
    steps = steps.split(",");
    // update the direction
    direction = await Direction.findByIdAndUpdate(id ,{$set:{steps:steps}},{new:true})
    success = true;
    return res.json({success , message:"Direction updated successfully"});
      
  } catch (error) {
      console.log(error.message);
      return res.status(500).json({ success, message: "Internal server error" });
  }
})

// fetch location specific direction
router.delete("/delete/:id" , fetchapp , upload.any() , async(req , res)=>{
  let success = false;
  const {id} = req.params;
  try {
    const app = req.app;
    // checking if the direction is exists or not
    let direction = await Direction.findById(id);
    if(!direction){
      return res.status(404).json({success , message:"Direction not found"})
    }
    // delete the direction
    direction = await Direction.findByIdAndDelete(id)
    success = true;
    return res.json({success , message:"Direction deleted successfully"});
  } catch (error) {
      console.log(error.message);
      return res.status(500).json({ success, message: "Internal server error" });
  }
})







module.exports = router;