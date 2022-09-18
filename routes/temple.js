const express = require("express");
const router = express.Router();
const Temple = require("../models/Temple");
const TempleEvents = require("../models/TempleEvents");
require('dotenv').config();
const fetchapp = require("../middlewares/fetchapp");
const fetchuser = require("../middlewares/fetchuser");
const fs = require('fs');

//multer setup start ---------------------------------------------------

const multer = require('multer');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'static/images/temples')
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

    if (!req.file) {
      return res.status(400).json({ success, message: "File needs to be uploaded" })
    }

    // create a new temple
    temple = await Temple.create({
      name: req.body.name,
      location: req.body.location,
      title: req.body.title,
      description: req.body.description,
      image: `${process.env.HOST}/static/images/temples/${req.file.filename}`,
      openingTime: new Date(`1970-01-01T${req.body.openingTime}:00`).getTime(),
      closingTime: new Date(`1970-01-01T${req.body.closingTime}:00`).getTime()
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
    let temple = await Temple.find().select("-events");
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
  const {location , title , description , openingTime , closingTime} = req.body;
  try {
    const app = req.app;
    // fetching the temple which needs to be updated
    let temple = await Temple.findById(id);

    if (!temple) {
      return res.status(404).json({ success, message: "Temple not found" })
    }

    // creating a new temple object
    let newTemple = {}

    if (req.file) {
      // deleteing the previous image
      const path = temple.image.substring(temple.image.indexOf("/", 9) + 1);
      fs.unlink(path, (err) => {
          if (err) {
              console.error(err)
              return
          }
      })
  newTemple.image = `${process.env.HOST}/static/images/temples/${req.file.filename}`;
    }

    if (location) {
      newTemple.location = location;
    }
    if (title) {
      newTemple.location = title;
    }

    if (description) {
      newTemple.description = description;
    }
    if (openingTime) {
      newTemple.openingTime = new Date(`1970-01-01T${openingTime}:00`).getTime();
    }
    if (closingTime) {
      newTemple.closingTime = new Date(`1970-01-01T${closingTime}:00`).getTime();
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
    if (!temple) {
      return res.status(404).json({ success, message: "Temple not found" })
    }

    // deleting the image from this folder
      
    const path = temple.image.substring(temple.image.indexOf("/", 9) + 1);
    fs.unlink(path, (err) => {
        if (err) {
            console.error(err)
            return
        }
    })

    // delete the temple
    temple = await Temple.findByIdAndDelete(id);
    success = true;
    return res.json({ success, message: temple })

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success, message: "Internal server error" });
  }
})

// add an event to a temple
router.put("/addevent", fetchapp, upload.any(), async (req, res) => {
  let success = false;
  const { templeId, date, title, description, openingTime, closingTime } = req.body;
  try {
    const app = req.app;
    // check if the temple exists or not
    let temple = await Temple.findById(templeId);
    if (!temple) {
      return res.status(404).json({ success, message: "Temple not found" });
    }

    // create a new TempleEvents
    let templeEvents = await TempleEvents.create({
      templeId: templeId,
      date: new Date(date).getTime(),
      title: title,
      description: description,
      openingTime: new Date(`1970-01-01T${openingTime}:00`).getTime(),
      closingTime: new Date(`1970-01-01T${closingTime}:00`).getTime()
    })

    // add new templeEvents id to the temple events
    temple = await Temple.findByIdAndUpdate(templeId, { $push: { events: templeEvents._id.toString() } }, { new: true })

    let success = true;
    return res.json({ success, message: "Events added successfully" })
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success, message: "Internal server error" });
  }
})

// update an event of a temple
router.put("/updateevent", fetchapp, upload.any(), async (req, res) => {
  let success = false;
  const { templeEventsId, date, title, description, openingTime, closingTime } = req.body;
  try {
    // check if the templeEvents exists or not
    let templeEvents = await TempleEvents.findById(templeEventsId);
    if (!templeEvents) {
      return res.status(404).json({ success, message: "Temple event not found" });
    }

    // create a new templeEvents object
    let newTempleEvents = {};
    if (date) { newTempleEvents.date = new Date(date).getTime() };
    if (title) { newTempleEvents.title = title };
    if (description) { newTempleEvents.description = description };
    if (openingTime) { newTempleEvents.openingTime = new Date(`1970-01-01T${openingTime}:00`).getTime() };
    if (closingTime) { newTempleEvents.closingTime = new Date(`1970-01-01T${closingTime}:00`).getTime() };

    // updating the temple event
    templeEvents = await TempleEvents.findByIdAndUpdate(templeEventsId, { $set: newTempleEvents }, { new: true })
    success = true;
    return res.json({ success, message: "Temple events updated successfully" })
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success, message: "Internal server error" });
  }
})

// delete an event of a temple
router.delete("/deleteevent", fetchapp, upload.any(), async (req, res) => {
  let success = false;
  const { templeEventsId } = req.body;
  try {
    // check if the templeEvents exists or not
    let templeEvents = await TempleEvents.findById(templeEventsId);
    if (!templeEvents) {
      return res.status(404).json({ success, message: "Temple event not found" });
    }

    // getting templeId from templeEvents
    let templeId = templeEvents.templeId;
    console.log(templeId)
    // deleting the templeEventsId from the temple
    let temple = await Temple.findByIdAndUpdate(templeId, { $pull: { events: templeEventsId } }, { new: true });
    console.log(temple)
    // deleting the templeEvents
    templeEvents = await TempleEvents.findByIdAndDelete(templeEventsId);
    success = true;
    return res.json({ success, message: "Temple event delete successfully" })


  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success, message: "Internal server error" });
  }
})

// get an event of a temple
router.get("/fetcheventsdate", fetchapp, upload.any(), async (req, res) => {
  let success = false;
  const { templeId ,date } = req.query;
  try {
    const app = req.app;
    // finding all the events of this temple
    let templeEvents = await TempleEvents.find({ templeId });
    let templeEventsDate = {};
    for (let index = 0; index < templeEvents.length; index++) {
      const element = templeEvents[index];
      // console.log(element)
      if (Object.keys(templeEventsDate).includes(new Date(element.date).toLocaleDateString('sv'))) {
        templeEventsDate[new Date(element.date).toLocaleDateString('sv')] += 1
      }
      else {
        templeEventsDate[new Date(element.date).toLocaleDateString('sv')] = 1;
      }
    }
    if(date){
      templeEvents = templeEvents.filter(templeEvent =>new Date(templeEvent.date).toLocaleDateString('sv')===date )
      success = true;
      return res.json({success , message:templeEvents});
    }
    else{

      success = true;
      return res.json({success , message:templeEventsDate})
    }


  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success, message: "Internal server error" });
  }
})

 // fetch all events
 router.get("/fetchallevents", fetchapp, upload.any(), async (req, res) => {
  let success = false;
  try {
    const app = req.app;
    // finding all the events of this temple
    let templeEvents = await TempleEvents.find();
    let allTempleEvents =[];
    for (let index = 0; index < templeEvents.length; index++) {
      const element = templeEvents[index];
      let temple = await Temple.findById(element.templeId);
      allTempleEvents.push({...element._doc , templeName:temple.name})
    }
    success = true;
    return res.json({success , message:allTempleEvents}) 


  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success, message: "Internal server error" });
  }
})





module.exports = router;