require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const app = express();
const path = require("path")

// Middleware to parse JSON
app.use(express.json());
app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine','hbs')
app.set('views',path.join(__dirname,'/views'))

try{
    const dbURL = "mongodb://localhost:27017/instagram";  
    // console.log(dbURL);
    mongoose.connect(dbURL).then(()=>{
        console.log("db is connected succsesfully");
    }).catch((err)=>{
        console.log(err);
    })
}catch(err){
    console.log(err);
}

const user = require("./routes/user")
app.use('/',user);

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
