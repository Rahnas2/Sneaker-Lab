const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'users'
    },
    addresses:[
        {
            fullName:{
                type:String,
                required:true
            },
            mobile:{
                type:String,
                required:true
            },
            localAddress:{
                type:String,
                required:true
            },
            pinCode:{
                type:Number,
                required:true
            },
            country:{
                type:String,
                required:true
            },
            state:{
                type:String,
                required:true
            },
            city:{
                type:String,
                required:true
            },
            typeOfAddress:{
                type:String,
                enum: ['Home', 'Office'], 
                required: true 
            },
            isDefault:{
                type:Boolean,
                default:false
            }
        }
    ]
},{timestamps:true})

module.exports = mongoose.model('address',addressSchema)