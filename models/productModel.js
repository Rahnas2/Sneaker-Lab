const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    productName:{
        type:String,
        require:true
    },
    productDescription:{
        type:String,
        required:true
    },
    category:{  
        type:mongoose.Schema.Types.ObjectId,
        ref:'categories',
        required:true
    },
    brand:{  
        type:mongoose.Schema.Types.ObjectId,
        ref:'brands',
        required:true
    },
    variants: [{ 
        type:mongoose.Schema.Types.ObjectId,
        ref:'variants',
        required:true
     }],
    review:[
        {
        comments:{type:String},
        rating:{type:Number},
        userId:{type:mongoose.Schema.Types.ObjectId, ref:'users'}
        }
    ],
    deleted:{
       type:Boolean,
       default:false
    }
},{timestamps:true})

productSchema.index({ productName: 'text' });

module.exports = new mongoose.model('products',productSchema)     