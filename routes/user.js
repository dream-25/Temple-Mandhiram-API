const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Family = require("../models/Family");
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

router.post("/register", fetchapp, upload.any(), [
  body('password', "Password can't be less than 6 letters").isLength({ min: 6 }),
  body('phone', "Enter a valid phone number").isLength({ min: 10 }),
  body('name', "Name can't be less than 3 letters").isLength({ min: 3 }),
], async (req, res) => {
  let success = false;
  // // if there are errors return bad request and the errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success, message: errors.array() });
  }

  // check whether the user with same phone exists already
  try {
    const app = req.app;
    let user = await User.findOne({ phone: req.body.phone });
    if (user) {
      return res.status(400).json({ success, message: "Sorry a user with this phone already exists" })
    }

    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(req.body.password, salt);
    // create a new user
    user = await User.create({
      phone: req.body.phone,
      password: secPass,
      name: req.body.name,
      birthDate: new Date(req.body.birthDate)
    })

    success = true;
    return res.json({ success, message: "New user registered successfully" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({ success, message: "Internal server error" });
  }
})

//Router-2 login a user using phone

router.post("/login", fetchapp, upload.any(),
  [
    body('phone', "Enter a valid phone number").isMobilePhone(),
    body('password', "password can't be blank").exists(),
  ],
  async (req, res) => {
    let success = false;
    // if there are errors return bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, message: errors.array() });
    }


    try {
      const app = req.app;
      // check whether the user exists or not 
      let user = await User.findOne({ phone: req.body.phone });
      if (!user) {
        return res.status(404).json({ success, message: "user not found" })
      }
      if (user.isVerified === true) {
        // comparing the given password with the saved password in database
        const passwordCompare = await bcrypt.compare(req.body.password, user.password);
        if (!passwordCompare) {
          return res.status(400).json({ success, message: "Please try to login with correct credentials" });
        }

        // creating jwt token
        const data = { user: user._id };
        const authUser = jwt.sign(data, process.env.JWT_SECRET)

        success = true;
        return res.json({ success, authUser });
      }
      else {
        return res.status(400).json({ success, message: "You are not a verified user so you can not login" })
      }
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ success, message: "Internal server error" });
    }
  })


//   router-3 update password and other details by admin
router.put("/update", fetchapp, upload.single("image"), async (req, res) => {
  let success = false;
  const { phone, password, isVerified  } = req.body;
  try {
    const app = req.app;
    // check whether the user exists or not 
    let user = await User.findOne({ phone: phone });
    if (!user) {
      return res.status(404).json({ success, message: "user not found" })
    }

    if (req.file) {
      if (user.image === "") {
        uploadFile(req.file.filename)
      }
      else {
        let oldPicture = user.image.substring(56);
        updateFile(oldPicture, req.file.filename);
      }
    }



    // create a new user object
    const newUser = {};

    if (req.file) {
      newUser.image = `https://rajkumars3connectionwithnodejs.s3.amazonaws.com/${req.file.filename}`;
      // deleting the file from this folder
      const path = req.file.filename;

      fs.unlink(path, (err) => {
        if (err) {
          console.error(err)
          return
        }
      })
    };
    if (isVerified) {
      newUser.isVerified = isVerified;
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(password, salt);
      newUser.password = secPass;
    }


    // updating the user
    user = await User.findOneAndUpdate({ phone }, { $set: newUser }, { new: true });
    success = true;
    return res.json({ success, message: "User details updated successfully" });

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success, message: "Internal server error" });
  }
})

//    update password and other details by user
router.put("/updateuser", fetchuser, upload.single("image"), async (req, res) => {
  let success = false;
  const { phone , name , birthDate , password  } = req.body;
  try {
    const id = req.user;
    // getting the user
    let user = await User.findById(id);
    // creating a new user object 
    let newUser = {}

    if (phone) {
      // check whether any user with this phone number exists or not 
    user = await User.findOne({ phone: phone });
    if (user) {
      return res.status(404).json({ success, message: "this number is already used" })
    }
    newUser.phone = phone;
    }

    if (req.file) {
      if (user.image === "") {
        uploadFile(req.file.filename)
      }
      else {
        let oldPicture = user.image.substring(56);
        updateFile(oldPicture, req.file.filename);
      }
    }

    

    if (req.file) {
      newUser.image = `https://rajkumars3connectionwithnodejs.s3.amazonaws.com/${req.file.filename}`;
      // deleting the file from this folder
      const path = req.file.filename;

      fs.unlink(path, (err) => {
        if (err) {
          console.error(err)
          return
        }
      })
    };
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(password, salt);
      newUser.password = secPass;
    }

    if(name){newUser.name= name}
    if(birthDate){newUser.birthDate = new Date(birthDate)}


    // updating the user
    user = await User.findByIdAndUpdate(id, { $set: newUser }, { new: true });
    success = true;
    return res.json({ success, message: "User details updated successfully" });

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success, message: "Internal server error" });
  }
})

router.get("/fetch" , fetchuser , async(req ,res)=>{
  let success =false;
  try {
    const id = req.user;
    let user = await User.findById(id).select("-password");
    success = true;
    return res.json({success , message:user});
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success, message: "Internal server error" });
  }

})


router.get("/fetchall" , fetchapp , async(req ,res)=>{
  let success =false;
  try {
    const app = req.app;
    let users = await User.find();
    success = true;
    return res.json({success , message:users});
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success, message: "Internal server error" });
  }

})

// delete a user
router.delete("/delete" , fetchuser , async(req , res)=>{
  let success = false;
  try {
    const id = req.user;

    // finding the user to be deleted
    let user = await User.findById(id);
    if (user.image !== "") {
      let oldPicture = user.profilePicture.substring(56);
      deleteFile(oldPicture);
    }
    // delete the user
    user = await User.findByIdAndDelete(id);
    success = true;
    return res.json({success , message:user})
    
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success, message: "Internal server error" });
  }
})

// add a family
router.post("/family" , fetchuser , upload.any(), async(req , res)=>{
  let success = false;
  const {name , birthDate , gender , relation , location , gotra}= req.body;
  try {
    const id = req.user;
    // checking if this family member is already present in the users family list
    let family = await Family.findOne({$and:[{userId:id} , {name}]});
    if(family){
      return res.status(400).json({success , message:"This member is already in your family"})
    }

    // create a new family
    family = await Family.create({
      userId:id,
      name:name,
      birthDate: new Date(birthDate),
      gender:gender,
      relation:relation,
      location:location,
      gotra:gotra
    })

    success = true;
    return res.json({success , message:family});
    
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success, message: "Internal server error" });
  }
})


// fetch all family members
router.get("/family" , fetchuser , async(req , res)=>{
  let success = false;
  try {
    const id= req.user;
    // find all family members of this user
    const family = await Family.find({userId:id});
    success = true;
    return res.json({success , message:family})
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success, message: "Internal server error" });
  }
})

// update a family member
router.put("/family" , fetchuser , upload.any(), async(req , res)=>{
  let success = false;
  const {familyId ,name , birthDate , gender , relation , location , gotra} = req.body;
  try {
    const id = req.user;
    // find the family member whose details to be updated
    let family = await Family.findOne({$and:[{_id:familyId} , {userId:id}]})
    if(!family){
      return res.status(404).json({success , message:"No family found"});
    }

    // create a new family object
    let newFamily = {};
    if(name){
      // check if there are any family member with same name of this user
      let family = await Family.findOne({$and:[{userId:id} , {name}]});
      if(family){
        return res.status(400).json({success , message:`A family member of same name is already present`})
      }
      newFamily.name=name;
    }
    if(birthDate){
      newFamily.birthDate = new Date(birthDate).getTime();
    }
    if(gender){
      newFamily.gender = gender;
    }
    if(relation){
      newFamily.relation = relation;
    }
    if(location){
      newFamily.location = location;
    }
    if(gotra){
      newFamily.gotra = gotra;
    }

    // update the family
    family = await Family.findOneAndUpdate({_id:familyId} , {$set:newFamily} , {new:true})
    success = true;
    return res.json({success , message:family})


    
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success, message: "Internal server error" });
  }
})

// delete a family member
router.delete("/family" , fetchuser , upload.any(), async(req , res)=>{
  let success = false;
  const {familyId} = req.body;
  try {
    const id = req.user;
    // find the family member to be deleted
    let family = await Family.findOne({$and:[{_id:familyId} , {userId:id}]})
    if(!family){
      return res.status(404).json({success , message:"No family found"});
    }

    // delete the family member
    family = await Family.findOneAndDelete({$and:[{_id:familyId} , {userId:id}]});
    success = true;
    return res.json({success , message:family})
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success, message: "Internal server error" });
  }
})







module.exports = router;