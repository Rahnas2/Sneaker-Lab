
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
    endDate:{
        type:Date,
        required:true
    },
    usedBy: [{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }],
    isActive:{
        type:Boolean,
        required:true,
        default:true
    }
})

module.exports = new mongoose.model('coupon',couponSchmea)
