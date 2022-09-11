const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Blog = require("../models/Blog");
const BlogComment = require("../models/BlogComment");
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
const { findOne } = require("../models/Family");

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

// post a blog
router.post("/add", fetchapp, upload.single("image"), async (req, res) => {
    let success = false;
    const { slug, title, content, date } = req.body;

    try {
        const app = req.app;
        // checking if the blog with same title is already present or not
        let blog = await Blog.findOne({ title });
        if (blog) {
            return res.status(400).json({ success, message: "Sorry this blog is already exists , please change the title of the blog" })
        }

        // checking if the blog with same slug is already present or not
        blog = await Blog.findOne({ slug });
        if (blog) {
            return res.status(400).json({ success, message: "Sorry this blog is already exists , please change the slug of the blog" })
        }

        if (req.file) {
            uploadFile(req.file.filename)
        }

        // create a new blog
        blog = await Blog.create({
            slug: slug,
            title: title,
            content: content,
            date: new Date(date).getTime(),
            image: req.file ? `https://rajkumars3connectionwithnodejs.s3.amazonaws.com/${req.file.filename}` : ""
        })
        if (req.file) {
            // deleting the file from this folder
            const path = req.file.filename;

            fs.unlink(path, (err) => {
                if (err) {
                    console.error(err)
                    return
                }
            })
        }

        success = true;
        return res.json({ success, message: blog })


    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success, message: "Internal server error" });
    }
})


// fetch all the blogs
router.get("/fetchall", fetchapp, async (req, res) => {
    let success = false;
    try {
        const app = req.app;
        // fetching all blogs
        let blogs = await Blog.find().select("-content");
        for (let index = 0; index < blogs.length; index++) {
            blogs[index] = {...blogs[index]._doc , like:blogs[index]._doc.like.length, comment:blogs[index]._doc.comment.length, share:blogs[index]._doc.share.length}
            
        }
        success = true;
        return res.json({ success, message: blogs })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success, message: "Internal server error" });
    }
})

// fetch a single blogs
router.get("/fetch/:id", fetchapp, async (req, res) => {
    let success = false;
    const { id } = req.params;
    try {
        const app = req.app;

        // fetching the blog
        let blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({ success, message: blog })
        }
        success = true;
        return res.json({ success, message: blog })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success, message: "Internal server error" });
    }
})

// update a blog
router.put("/update/:id", fetchapp, upload.single("image"), async (req, res) => {
    let success = false;
    const { title, content, date } = req.body;
    const blogId = req.params.id;
    try {
        const app = req.app;
        // checking if the blog exists or not
        let blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ success, message: "Blog not found" })
        }

        if (req.file) {
            if (blog.image === "") {
                uploadFile(req.file.filename)
            }
            else {
                let oldPicture = blog.image.substring(56);
                updateFile(oldPicture, req.file.filename);
            }
        }

        // creating a new blog object
        newBlog = {};

        if (req.file) {
            newBlog.image = `https://rajkumars3connectionwithnodejs.s3.amazonaws.com/${req.file.filename}`;
            // deleting the file from this folder
            const path = req.file.filename;

            fs.unlink(path, (err) => {
                if (err) {
                    console.error(err)
                    return
                }
            })
        };

        if (title) {
            // checking if any blog with this title exists or not
            blog = await Blog.findOne({ title });
            if (blog) {
                return res.status(400).json({ success, messsage: "A blog with same title already exists" })
            }
            newBlog.title = title;
        }
        if (content) {
            newBlog.content = content;
        }
        if (date) {
            newBlog.date = new Date(date).getTime();
        }


        // updatedAt to be changed
        newBlog.updatedAt = new Date().getTime();
        // update the blog
        blog = await Blog.findByIdAndUpdate(blogId, { $set: newBlog }, { new: true })
        success = true;
        return res.json({ success, message: blog })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success, message: "Internal server error" });
    }
})



// comment on a blog
router.put("/comment", fetchuser, upload.any(), async (req, res) => {
    let success = false;
    const { blogId, parentId, comment } = req.body;
    try {
        const userId = req.user;
        // checking if the blog present or not
        let blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ success, message: "Blog not found" })
        }
        // checking if the parent is present or not
        if (parentId && parentId !== null) {
            let parentComment = await BlogComment.findById(parentId);
            if (!parentComment) {
                return res.status(404).json({ success, message: "Parent comment not found" })
            }
        }

        // creating a new blogComment
        let blogComment = await BlogComment.create({
            userId: userId,
            blogId: blogId,
            parentId: parentId ? parentId : null,
            comment: comment
        })

        // add _id of the new blogComment to the comment array of blog model
        blog = await Blog.findByIdAndUpdate(blogId, { $push: { comment: blogComment._id } }, { new: true })

        success = true;
        return res.json({ success, message: blogComment })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success, message: "Internal server error" });
    }
})

// get allcommenter of a blog
router.post("/comment", fetchapp,upload.any(), async (req, res) => {
    let success = false;
    const { blogId } = req.body;
    try {
        // checking if the blog exists or not
        let blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ success, message: "Blog not found" })
        }
        let commenters = [];
        for (let index = 0; index < blog.comment.length; index++) {
            const blogCommentId = blog.comment[index];
            let blogComment = await BlogComment.findById(blogCommentId);
            let commenterId = blogComment.userId;
            let commenter = await User.findById(commenterId)
            commenter = {...commenter._doc, comment:blogComment.comment}
            commenters.push(commenter);
        }

        success = true;
        return res.json({ success, message: commenters })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success, message: "Internal server error" });
    }
})

// like a blog
router.put("/like", fetchuser, upload.any(), async (req, res) => {
    let success = false;
    const { blogId } = req.body;
    try {
        const userId = req.user;
        // checking if the blog present or not
        let blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ success, message: "Blog not found" })
        }


        // cheking if the userId is already in the like array of blog model or not
        blog = await Blog.findOne({ $and: [{ _id: blogId }, { like: { $elemMatch: { $eq: userId } } }] });
        if (blog) {
            console.log("yes")
            // remove the userId from the like array of the blog
            blog = await Blog.findByIdAndUpdate(blogId, { $pull: { like: userId } }, { new: true });
        }
        else {
            // add userId of the user to the like array of blog model

            blog = await Blog.findByIdAndUpdate(blogId, { $push: { like: userId } }, { new: true })
        }


        success = true;
        return res.json({ success, message: blog })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success, message: "Internal server error" });
    }
})

// get allliker of a blog
router.post("/like", fetchapp,upload.any(), async (req, res) => {
    let success = false;
    const { blogId } = req.body;
    try {
        // checking if the blog exists or not
        let blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ success, message: "Blog not found" })
        }
        let likers = [];
        for (let index = 0; index < blog.like.length; index++) {
            const likerId = blog.like[index];
            let liker = await User.findById(likerId);
            likers.push(liker);
        }

        success = true;
        return res.json({ success, message: likers })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success, message: "Internal server error" });
    }
})


module.exports = router;