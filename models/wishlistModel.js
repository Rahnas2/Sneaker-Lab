
const mongoose = require('mongoose')


const wishlistSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'Users'
    },
    productId:[{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'products'
    }]
})

module.exports = mongoose.model('wishlist',wishlistSchema)