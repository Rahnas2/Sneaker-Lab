const mongoose = require('mongoose')

const verify_otp = new mongoose.Schema({
    email:{
        type:String,
        require:true
    },
    otp:{
        type:String,
        require:true
    },
    createdAt:{
        type:Date,
        default:Date.now      
    },
    expiresAt:{
        type:Date,
        require:true,
        index:{expires:'30s'}
    }
})

module.exports = mongoose.model('otp',verify_otp)