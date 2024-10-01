
const cartCollection = require('../models/cartModel')


exports.applyShippingCharge = async (userId,totalAmount) =>{
    console.log('skfhk',userId,totalAmount)
    if(totalAmount < 5000){

        await cartCollection.updateOne(
            {userId:userId},
            {
                $set:{shippingFee:40}
            }
        )
    }else{
        await cartCollection.updateOne(
            {userId:userId},
            {
                $set:{shippingFee:0}
            }
        )
    }
    
}