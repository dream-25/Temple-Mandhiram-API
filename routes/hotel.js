const express = require("express");
const router = express.Router();
const Temple = require("../models/Temple");
const Hotel = require("../models/Hotel");
require('dotenv').config();
const fetchapp = require("../middlewares/fetchapp");
const fetchuser = require("../middlewares/fetchuser");
const fs = require('fs');


//multer setup start ---------------------------------------------------

const multer = require('multer');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'static/images/hotels')
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
    const { templeId, name ,description } = req.body;
    try {
        const app = req.app;
        // checking if the temple exists or not
        let temple = await Temple.findById(templeId);
        if (!temple) {
            return res.status(404).json({ success, message: "Temple not found" })
        }
        if (!req.file) {
            return res.status(400).json({ success, message: "File needs to be uploaded" })
        }

        // create a new hotel
        let hotel = await Hotel.create({
            templeId: templeId,
            name: name,
            description:description,
            templeName:temple.name,
            image: `${process.env.HOST}/static/images/hotels/${req.file.filename}`,
        })

        // adding id of the new hotel to the temples hotel list
        temple = await Temple.findByIdAndUpdate(templeId , {$push:{hotels:hotel._id.toString()}},{new:true})

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
    const {name , description} = req.body;
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
        // deleteing the previous image
          const path = hotel.image.substring(hotel.image.indexOf("/", 9) + 1);
          fs.unlink(path, (err) => {
              if (err) {
                  console.error(err)
                  return
              }
          })
      newHotel.image = `${process.env.HOST}/static/images/hotels/${req.file.filename}`;
      }
  
      if (name) {
        newHotel.name = name;
      }
      if(description){
        newHotel.description = description;
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
  
      // deleting the image from this folder
      
        const path = hotel.image.substring(hotel.image.indexOf("/", 9) + 1);
        fs.unlink(path, (err) => {
            if (err) {
                console.error(err)
                return
            }
        })
    
  
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