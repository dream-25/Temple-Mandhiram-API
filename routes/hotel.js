const express = require("express");
const router = express.Router();
const Temple = require("../models/Temple");
const Hotel = require("../models/Hotel");
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

// add a hotel
router.post("/add", fetchapp, upload.single("image"), async (req, res) => {
    let success = false;
    const { templeId, name } = req.body;
    try {
        const app = req.app;
        // checking if the temple exists or not
        let temple = await Temple.findById(templeId);
        if (!temple) {
            return res.status(404).json({ success, message: "Temple not found" })
        }
        if (req.file) {
            uploadFile(req.file.filename)
        }
        else {
            return res.status(400).json({ success, message: "File needs to be uploaded" })
        }

        // create a new hotel
        let hotel = await Hotel.create({
            templeId: templeId,
            name: name,
            templeName:temple.name,
            image: `https://rajkumars3connectionwithnodejs.s3.amazonaws.com/${req.file.filename}`,
        })

        // adding id of the new hotel to the temples hotel list
        temple = await Temple.findByIdAndUpdate(templeId , {$push:{hotels:hotel._id.toString()}},{new:true})

        // deleting the file from this folder
        const path = req.file.filename;

        fs.unlink(path, (err) => {
            if (err) {
                console.error(err)
                return
            }
        })

        success = true;
        return res.json({ success, message: "Hotel added successfully" });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success, message: "Internal server error" });
    }
})

// fetch all hotels
router.get("/fetchall", fetchapp, async (req, res) => {
    let success = false;
    try {
        const app = req.app;
        // finding all hotel
        let hotels = await Hotel.find();
        success = true;
        return res.json({success , message:hotels})

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success, message: "Internal server error" });
    }
})

// fetch temple specific hotels
router.get("/fetch", fetchapp, async (req, res) => {
    let success = false;
    const {templeId} = req.query;
    try {
        const app = req.app;
        // finding all hotel
        let hotels = await Hotel.find({templeId:templeId});
        success = true;
        return res.json({success , message:hotels})
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success, message: "Internal server error" });
    }
})

// update a hotel details
router.put("/update/:id", fetchapp, upload.single("image"), async (req, res) => {
    let success = false;
    const { id } = req.params;
    try {
      const app = req.app;
      // fetching the hotel which needs to be updated
      let hotel = await Hotel.findById(id);
  
      if (!hotel) {
        return res.status(404).json({ success, message: "Hotel not found" })
      }
  
      // creating a new hotel object
      let newHotel = {}
  
      if (req.file) {
        let oldPicture = hotel.image.substring(56);
        updateFile(oldPicture, req.file.filename);
        newHotel.image = `https://rajkumars3connectionwithnodejs.s3.amazonaws.com/${req.file.filename}`
        // deleting the file from this folder
        const path = req.file.filename;
  
        fs.unlink(path, (err) => {
          if (err) {
            console.error(err)
            return
          }
        })
      }
  
      if (req.body.name) {
        newHotel.name = req.body.name;
      }
  
      
      // update the hotel
      hotel = await Hotel.findByIdAndUpdate(id, { $set: newHotel }, { new: true })
  
  
  
      success = true;
      return res.json({ success, message: hotel});
    } catch (error) {
      console.log(error.message);
      return res.status(500).send({ success, message: "Internal server error" });
    }
  })

  // deleting a hotel
  router.delete("/delete/:id", fetchapp, async (req, res) => {
    let success = false;
    const { id } = req.params;
    try {
  
  
      // finding the hotel to be deleted
      let hotel = await Hotel.findById(id);
      if (!hotel) {
        return res.status(404).json({ success, message: "Hotel not found" })
      }
  
      let oldPicture = hotel.image.substring(56);
      deleteFile(oldPicture);
  
      // delete the hotel
      hotel = await Hotel.findByIdAndDelete(id);
      // removing the hotel id from temple hotels list
      let temple = await Temple.findByIdAndUpdate(hotel.templeId , {$pull:{hotels:hotel._id.toString()}} ,{new:true})
      success = true;
      return res.json({ success, message: hotel })
  
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ success, message: "Internal server error" });
    }
  })








module.exports = router;