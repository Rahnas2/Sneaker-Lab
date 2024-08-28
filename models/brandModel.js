const mongoose = require('mongoose')


const brandSchema = new mongoose.Schema({
    brandName:{
        type:String,
        required:true
    },
    brandDescription:{
        type:String,
        required:true
    },
    deleted:{
        type:Boolean,
        default:false
    }
},{timestamps:true})

module.exports =  mongoose.model('brands',brandSchema)  