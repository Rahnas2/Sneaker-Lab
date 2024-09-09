const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users'
    },
    items:[{
        product:{type:mongoose.Schema.Types.ObjectId,ref:'products'},
        quantity:{type:Number,default:1},
        itemTotal:{type:Number}
    }],
    shippingFee:{
        type:Number,
        default:0
    },
    coupanDiscount:{
        type:Number,
        default:0
    },
    totalQuantity:{
        type:Number,
        default:0 
    },
    totalPrice:{
        type:Number,
        default:0.00

    }
},{timestamps:true})

cartSchema.pre('save', async function(next){
    try {
        let total = 0
        const populatedProduct = await this.populate('items.product')
    
        this.items.forEach(item => {
            const cartTotal = item.itemTotal
            total += cartTotal
        });
    
        this.totalPrice = total
    
        this.totalQuantity = this.items.length
    
        next() 
    } catch (error) {
        console.log('something went wrong',error)
    }
    
})

module.exports = mongoose.model('cart',cartSchema)
