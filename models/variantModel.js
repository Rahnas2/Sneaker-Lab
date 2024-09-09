const mongoose = require('mongoose')

const variantSchema = new mongoose.Schema({
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'products',
        required:true
    },
    color:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    images:{
        type:[String],
        required:true
    },
    sizes:[{
        size:{
            type:Number,
            required:true
        },
        stock:{
            type:Number,
            required:true
        }
    }]
},{timestamps:true})

module.exports = mongoose.model('variants',variantSchema)