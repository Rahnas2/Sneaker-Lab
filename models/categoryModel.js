const mongoose = require('mongoose')


const categorySchema = new mongoose.Schema({
    categoryName:{
        type:String,
        required:true
    },
    categoryDescription:{
        type:String,
        required:true
    },
    deleted:{
        type:Boolean,
        default:false
    },
    offer:{
        discountPercentage:{type:Number},
        expirAt:{type:Date}
    }
},{timestamps:true})

module.exports =  mongoose.model('categories',categorySchema)  