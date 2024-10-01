
const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'Users'
    },
    deliveryAddress: {
        fullName: { type: String, required: true },
        mobile: { type: Number, required: true },
        localAddress: { type: String, required: true },
        pinCode: { type: String, required: true },
        country: { type: String, required: true },
        state: { type: String, required: true },
        city: { type: String, required: true },
        typeOfAddress: {type: String, required: true},
        email: {type: String}
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Product'
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'variants'
        },
        productName: { 
            type: String,
            required: true
        },
        image:{
           type:String
        },
        price: { 
            type: Number,
            required: true
        },
        offerPrice:{
            type:Number
        },
        quantity: { 
            type: Number,
            required: true,
            min: 1
        },
        itemTotal: { 
            type: Number,
            required: true
        },
        status:{
            type:String,
            default:'Order Placed'
        },
        paymentStatus:{
            type:String,
            default:'pending'
        },
        returnReson:{
            type:String
        }
    }],
    couponCode:{
        type:String
    },
    couponDiscount:{
        type:Number,
        default:0
    },
    shippingFee: {
        type:Number
    },
    paymentMethod: {
        type: String,
        required: true
    },
    totalAmount:{
        type:Number,
        required:true
    },
    expectedDelivery: {
        type: Date,
        default: () => Date.now() + 7 * 24 * 60 * 60 * 1000
    }
},{timestamps:true})


module.exports = mongoose.model('orders',orderSchema)  