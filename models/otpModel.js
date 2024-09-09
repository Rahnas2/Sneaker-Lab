const mongoose = require('mongoose')

const verify_otp = new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now      
    },
    expiresAt:{
        type:Date,
        required:true,
        index:{expires:'30s'}
    }
})

module.exports = mongoose.model('otp',verify_otp)