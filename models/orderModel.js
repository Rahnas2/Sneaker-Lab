
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
        quantity: { 
            type: Number,
            required: true,
            min: 1
        },
        itemTotal: { 
            type: Number,
            required: true
        }
    }],
    paymentMethod: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: Boolean,
        default: false
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'canceled', 'delivered'],
        default: 'pending'
    },
    totalAmount:{
        type:String,
        required:true
    },
    expectedDelivery: {
        type: Date,
        default: () => Date.now() + 7 * 24 * 60 * 60 * 1000
    }
},{timeStamps:true})


module.exports = mongoose.model('orders',orderSchema)  