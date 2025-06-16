
const mongoose = require('mongoose')

const couponSchmea = new mongoose.Schema({
    code:{
        type:String,
        required:true,
        unique:true
    },
    discountPercentage:{
        type:Number,
        required:true
    },
    maxAmount:{
        type:Number,
        reuired:true
    },
    minimumSpend:{
        type:Number,
        required:true
    },
    // startDate:{
    //     type:Date,
    //     required:true
    // },
    endDate:{
        type:Date,
        required:true
    },
    isActive:{
        type:Boolean,
        required:true,
        default:true
    }
})

module.exports = new mongoose.model('coupon',couponSchmea)
