const express = require("express");
const router = express.Router();
const Welcome = require("../models/Welcome")
require('dotenv').config();
const fetchapp = require("../middlewares/fetchapp");
const fetchuser = require("../middlewares/fetchuser");
const fs = require('fs');

//multer setup start ---------------------------------------------------

const multer = require('multer');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'static/images/welcomes')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})


const upload = multer({ storage: storage })
// multer part end --------------------





//Router-1 add a welcome

router.post("/add", fetchapp, upload.single("image"), async (req, res) => {
  let success = false;
  // check whether the user with same phone exists already
  try {
    const app = req.app;


    // finding all welcome
    let welcome = await Welcome.find();

    if (welcome.length < 2) {

      if (!req.file) {
        return res.status(400).json({ success, message: "File needs to be uploaded" })
      }
      // create a new welcome
      welcome = await Welcome.create({
        heading: req.body.heading,
        description: req.body.description,
        image: `${process.env.HOST}/static/images/welcomes/${req.file.filename}`
      })

      success = true;
      return res.json({ success, message: welcome });
    }
    else {
      return res.status(400).json({ success, message: "Can not add more than 2 welcome" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({ success, message: "Internal server error" });
  }
})

router.get("/fetchall", fetchapp, async (req, res) => {
  let success = false;
  try {
    const app = req.app;
    let welcomes = await Welcome.find();

    success = true;
    return res.json({ success, message: welcomes });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success, message: "Internal server error" });
  }

})

router.put("/update/:id", fetchapp, upload.single("image"), async (req, res) => {
  let success = false;
  // check whether the user with same phone exists already
  const { id } = req.params;
  try {
    const app = req.app;
    // fetching the welcome which needs to be updated
    let welcome = await Welcome.findById(id);

    if (!welcome) {
      return res.status(404).json({ success, message: "welcome not found" })
    }

    // creating a new welcome object
    let newWelcome = {}

    if (req.file) {
      // deleteing the previous image
      const path = welcome.image.substring(welcome.image.indexOf("/", 9) + 1);
      fs.unlink(path, (err) => {
          if (err) {
              console.error(err)
              return
          }
      })
  newWelcome.image = `${process.env.HOST}/static/images/welcomes/${req.file.filename}`;
    }

    if (req.body.heading) {
      newWelcome.heading = req.body.heading;
    }

    if (req.body.description) {
      newWelcome.description = req.body.description;
    }
    // update the welcome
    welcome = await Welcome.findByIdAndUpdate(id, { $set: newWelcome }, { new: true })

    success = true;
    return res.json({ success, message: welcome });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({ success, message: "Internal server error" });
  }
})


module.exports = router;