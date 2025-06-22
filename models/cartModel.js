const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users'
    },
    items:[{
        product:{type:mongoose.Schema.Types.ObjectId, ref:'products'},
        variant: {type: mongoose.Schema.Types.ObjectId, ref: 'variants'},
        quantity:{type:Number,default:1},
        offerPrice: {type:String},
        itemTotal:{type:Number}
    }],
    shippingFee:{
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
        let ShippingCharge = this.shippingFee
        // const populatedProduct = await this.populate('items.product')
    
        this.items.forEach(item => {
            const cartTotal = item.itemTotal
            total += cartTotal
        });
    
        this.totalPrice = total + ShippingCharge
    
        this.totalQuantity = this.items.length
    
        next() 
    } catch (error) {
        console.log('something went wrong',error)
    }
    
})

module.exports = mongoose.model('cart',cartSchema)
