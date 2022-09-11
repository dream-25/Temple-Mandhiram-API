const express = require("express");
const router = express.Router();
const Temple = require("../models/Temple");
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





//Router-1 register a user using phone 

router.post("/add", fetchapp, upload.single("image"), async (req, res) => {
  let success = false;


  // check whether the temple with same name exists already
  try {
    const app = req.app;
    let temple = await Temple.findOne({ name: req.body.name });
    if (temple) {
      return res.status(400).json({ success, message: "Sorry a temple with same name already exists" })
    }

    if (req.file) {
      uploadFile(req.file.filename)
    }
    else {
      return res.status(400).json({ success, message: "File needs to be uploaded" })
    }

    // create a new temple
    temple = await Temple.create({
      name: req.body.name,
      location: req.body.location,
      description: req.body.description,
      image: `https://rajkumars3connectionwithnodejs.s3.amazonaws.com/${req.file.filename}`,
      openingTime: new Date(`1970-01-01T${req.body.openingTime}:00`).getTime(),
      closingTime: new Date(`1970-01-01T${req.body.closingTime}:00`).getTime()
    })

    // deleting the file from this folder
    const path = req.file.filename;

    fs.unlink(path, (err) => {
      if (err) {
        console.error(err)
        return
      }
    })

    success = true;
    return res.json({ success, message: temple });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({ success, message: "Internal server error" });
  }
})


// fetch all templates
router.get("/fetchall", fetchapp, async (req, res) => {
  let success = false;
  try {
    const app = req.app;
    let temple = await Temple.find();
    success = true;
    return res.json({ success, message: temple });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success, message: "Internal server error" });
  }

})



router.put("/update/:id", fetchapp, upload.single("image"), async (req, res) => {
  let success = false;
  const { id } = req.params;
  try {
    const app = req.app;
    // fetching the temple which needs to be updated
    let temple = await Temple.findById(id);

    if(!temple){
      return res.status(404).json({success , message:"Temple not found"})
    }

    // creating a new temple object
    let newTemple = {}

    if (req.file) {
      let oldPicture = temple.image.substring(56);
      updateFile(oldPicture, req.file.filename);
      newTemple.image = `https://rajkumars3connectionwithnodejs.s3.amazonaws.com/${req.file.filename}`
      // deleting the file from this folder
      const path = req.file.filename;

      fs.unlink(path, (err) => {
        if (err) {
          console.error(err)
          return
        }
      })
    }

    if (req.body.location) {
      newTemple.location = req.body.location;
    }

    if (req.body.description) {
      newTemple.description = req.body.description;
    }
    if (req.body.openingTime) {
      newTemple.openingTime = new Date(`1970-01-01T${req.body.openingTime}:00`).getTime();
    }
    if (req.body.closingTime) {
      newTemple.closingTime = new Date(`1970-01-01T${req.body.closingTime}:00`).getTime();
    }
    // update the temple
    temple = await Temple.findByIdAndUpdate(id, { $set: newTemple }, { new: true })



    success = true;
    return res.json({ success, message: temple });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({ success, message: "Internal server error" });
  }
})


// delete a temple
router.delete("/delete/:id", fetchapp, async (req, res) => {
  let success = false;
  const { id } = req.params;
  try {


    // finding the temple to be deleted
    let temple = await Temple.findById(id);
    if(!temple){
      return res.status(404).json({success , message:"Temple not found"})
    }

    let oldPicture = temple.image.substring(56);
    deleteFile(oldPicture);

    // delete the temple
    temple = await Temple.findByIdAndDelete(id);
    success = true;
    return res.json({ success, message: temple })

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success, message: "Internal server error" });
  }
})





module.exports = router;