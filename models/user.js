require('dotenv').config()
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken");



const User = new mongoose.Schema({
    user:{type:String,required:true},
    pass:{type:String,required:true},
    token:{type:String},
    items:[{
        img:{ 
            data: Buffer,
            contentType: String
        },
        desc:{type:String}
    }],
})



module.exports = new mongoose.model('user',User);