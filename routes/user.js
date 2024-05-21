const express = require('express');
const router = express.Router();
const User = require("../models/user");
const verifyUser = require("../middleware/verifyuser");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const multer = require('multer');

// Middleware setup
router.use(express.json());
router.use(cookieParser());
router.use(bodyParser.urlencoded({ extended: true }));

// Set up Multer storage
const storage = multer.memoryStorage(); // Store files in memory as Buffers
const upload = multer({ storage: storage });



// Routes
router.get("/", async (req, res) => {
    const token = req.cookies.usertoken;

    if (!token) {
        res.redirect("/login");
    } else {
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY_TOKEN);
        const userid = verifyUser._id;
        const userdata = await User.findById(userid);

        if (!userdata) {
            return res.send("Please login again after logout.");
        }

        const allItems = userdata.items.map(item => ({
            id: item._id,
            itemname: item.desc,
            img: `data:${item.img.contentType};base64,${item.img.data.toString('base64')}` // Convert binary data to base64 data URI
        }));

        res.render('home', { items: allItems });
    }
});



router.get("/registration", (req, res) => {
    res.render('usersignup');
});

router.post("/registration", async (req, res) => {
    try {
        const { pass, user } = req.body;
        const usersdb = await User.findOne({ user: user });
        // console.log(usersdb)
        if (usersdb) {
            return res.send("Username is already taken. Please choose another one");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(pass, 10);

        const newUser = new User({
            pass: hashedPassword,
            user,
        });

        await newUser.save();
        return res.redirect('/');
    } catch (err) {
        console.log(err);
        res.status(501).send("server error");
    }
});



router.get("/login", (req, res) => {
    res.render('userlogin');
});

router.post("/login", async (req, res) => {
    const { pass, user } = req.body;

    if (!user || !pass) {
        return res.send("Please fill in all the fields");
    }

    try {
        const usersdb = await User.findOne({ user });

        if (!usersdb) {
            return res.send('Please Enter Correct User and Password');
        }

        const isPasswordValid = await bcrypt.compare(pass, usersdb.pass);
        if (!isPasswordValid) {
            return res.send('Please Enter Correct User and Password');
        } else {
            try {
                const token = jwt.sign({ _id: usersdb._id }, process.env.SECRET_KEY_TOKEN);
                usersdb.token = token;
                await usersdb.save();
                res.cookie('usertoken', token);
                return res.redirect('/');
            } catch (error) {
                console.log("the error part" + error);
            }
        }
    } catch (err) {
        console.log(err);
        return res.status(501).send("server error");
    }
});



router.get("/addmessage", verifyUser, (req, res) => {
    res.render("message");
})
router.post("/addmessage", verifyUser, upload.single('img'), async (req, res) => {
    const { desc } = req.body;
    const token = req.cookies.usertoken;
    const verifyUser = jwt.verify(token, process.env.SECRET_KEY_TOKEN);
    console.log(desc)
    const userid = verifyUser._id;

    try {
        const userdata = await User.findById(userid);

        if (!userdata) {
            return res.send("Please login again after logout.");
        }

        const newItem = {
            img: {
                data: req.file.buffer,
                contentType: req.file.mimetype,
            },
            desc,
        };

        userdata.items.push(newItem);
        await userdata.save();
        console.log("Message have been save in the database")
        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});



router.get("/logout", async (req, res) => {
    res.clearCookie("usertoken");
    res.redirect('/login');
})



router.get("/image/:id", async (req, res) => {
    try {
        // console.log("hello my name is lakshy")
        const imageId = req.params.id;
        const convertObjectid = new mongoose.Types.ObjectId(imageId);
        const users = await User.find({ 'items._id': convertObjectid }, { 'items.$': 1 });
        if (!users || users.length === 0) {
            return res.status(404).send('Image not found');
        }

        const user = users[0];
        const item = user.items.id(imageId);
        const imgBuffer = user.items[0].img.data;

        const items = [{
            itemname: user.items[0].desc,
            img: `data:${item.img.contentType};base64,${imgBuffer.toString('base64')}`
        }];


        return res.render("usershare", { items: items })


    } catch (error) {
        console.log(error)
        return res.send(error)
    }
})

router.delete('/:itemId',verifyUser, async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const token = req.cookies.usertoken;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY_TOKEN);
        const userid = verifyUser._id;
        const userdata = await User.findById(userid);

        if (!userdata) {
            return res.status(404).json({ message: 'User not found' });
        }

        userdata.items = userdata.items.filter(item => item.id !== itemId);


        await userdata.save();

        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;