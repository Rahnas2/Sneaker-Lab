
const cron = require('node-cron')
const couponCollection = require('../models/couponModel')

cron.schedule('* * * * *', async () => {
    console.log('iam working')
    try {
        const now = new Date()

        const expiredCoupon = await couponCollection.find({endDate:{$lt:now},isActive:true})
        if (expiredCoupon.length > 0){
            await couponCollection.updateMany(
                {endDate:{$lt:now},isActive:true},
                {$set:{isActive:false}}
            )

            console.log(`updated ${expiredCoupon.length} expired coupon to inactive`)
        }
    } catch (error) {
        console.error('something went wrong',error)
    }
  });