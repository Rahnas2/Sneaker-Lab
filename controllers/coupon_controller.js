
const couponCollection = require('../models/couponModel')
const cartCollection = require('../models/cartModel')

const { validationResult } = require('express-validator')


exports.couponManagment = async(req,res)=>{
    try {
        const coupansList = await couponCollection.find()
        res.render('Admin/couponManagment',{
            coupansList
        })
    } catch (error) {
       console.error('something went wrong',error) 
    }
}

exports.addCoupon = async (req,res)=>{
    try {
        const {code, discountPercentage, maxAmount, minimumSpend, endDate} = req.body

        //validation
        const errors = validationResult(req)
        if(!errors.isEmpty()){
           const validationErrors = errors.array().reduce((acc,error)=>{
              acc[error.path] = error.msg
              return acc
           },{})
           console.log('validation error',validationErrors)
           return res.status(400).json({validationError:true,validationErrors})
        }

        const existingCoupon = await couponCollection.findOne({ code: code })

        //checking the coupon is already existed 
        if(existingCoupon){
            return res.json({existedCoupon:true,message:'sorry, this coupon already exist'})
        }

        //create coupon
        await couponCollection.create(req.body)
        return res.json({success:true,message:'coupon added successfully'})

    } catch (error) {
        console.error('sometihng went wrong',error)
    }
}

exports.editCoupon = async (req,res) =>{
    try {
        //validation
        const errors = validationResult(req)
        if(!errors.isEmpty()){
           const validationErrors = errors.array().reduce((acc,error)=>{
              acc[error.path] = error.msg
              return acc
           },{})
           console.log('validation error',validationErrors)
           return res.status(400).json({validationError:true,validationErrors})
        }

        const couponId = req.params.id
        const {code, discountPercentage, maxAmount, minimumSpend, endDate} = req.body

        const updatedCoupon = await couponCollection.findByIdAndUpdate(
            couponId, 
            {
                code,
                discountPercentage,
                maxAmount,
                minimumSpend,
                endDate,
                isActive:true
            },
            { new: true } 
        )

        if (!updatedCoupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' })
        }

        return res.json({success:true,message:'successfully updated the coupon'})


    } catch (error) {
        console.error('something went wrong',error)
    }
}


exports.couponDelete = async (req,res)=>{
    try {
        couponId = req.params.id

        await couponCollection.deleteOne({_id:couponId})

        return res.json({success:true,message:'coupon deleted successfully'})

    } catch (error) {
        console.error('something went wrong',error)
        return res.status(500).josn({success:false,message:'something went wrong while deleting the coupon'})
    }
}

exports.applyCoupon = async (req,res) =>{
    try {
        const {couponCode} = req.body
        console.log('coupon code',req.body)
        const userId = req.session.user

        const coupon = await couponCollection.findOne({code:couponCode})
        
        const cart = await cartCollection.findOne({userId})


        if(!cart){
            return res.json({success:false,message:'sorry, cart not found'})
        }


        if(coupon){
             if(!coupon.isActive){
                return res.json({success:false,message:'sorry, coupon expired'})
             }

             const maxAmount = coupon.maxAmount
             
             const minimumSpend = coupon.minimumSpend

             if(cart.totalPrice < minimumSpend){
                return res.json({success:false,message:`sorry, you are not able to use this coupon your total should be greater than or equals ${coupon.minimumSpend}`})
            }

             const subTotal = cart.totalPrice
             const discountPercentage = coupon.discountPercentage

             let couponDiscount = subTotal * (discountPercentage/100)

             if(couponDiscount > maxAmount){
                couponDiscount = maxAmount
             }


            let remainigDiscount = couponDiscount
            cart.items.forEach(item => {
                //proportional discount per items using the subtotal
                const itemProportionalDiscount = (item.itemTotal / subTotal) * couponDiscount

                const discountToApply = Math.min(item.itemTotal, itemProportionalDiscount)
                console.log('discounted price',discountToApply)

                item.itemTotal -= discountToApply

                remainigDiscount -= discountToApply
                item.markModified('itemTotal');
            });

            if(remainigDiscount > 0){
               let maxItem = cart.items.reduce((prev,curr)=> prev.itemTotal > curr.itemTotal ? prev : curr)
               maxItem.itemTotal -= remainigDiscount
            }

            

            try {
                await cart.save();
                console.log('Cart updated and saved successfully.');
            } catch (error) {
                console.error('Error saving the cart:', error);
                return res.json({ success: false, message: 'Error saving the cart' });
            }
            
            req.session.coupon = {
                code:couponCode,
                couponDiscount:couponDiscount,
                cartTotal:subTotal
            }

            

            return res.json({success:true,message:'coupon applied successfully'})
             
        }else{
            return res.json({notValid:true,message:'sorry, invlalid coupon'})
        }
    } catch (error) {
        console.error('something went wrong',error)
    }
}

exports.userRemoveCoupon = async (req,res) => {
    try {
        const userId = req.session.user
        const couponCode = req.session.coupon.code
        const couponDiscount = req.session.coupon.couponDiscount
        console.log('type of discount',couponDiscount)
        const appliedCoupon = await couponCollection.findOne({code:couponCode})
        
        const cart = await cartCollection.findOne({userId:userId})

        let remainingDiscount = couponDiscount
        const orignalCartTotal = req.session.coupon.cartTotal

        cart.items.forEach(item => {
            const itemProportionalDiscount = (item.itemTotal / orignalCartTotal) * couponDiscount

            const appliedDiscount = Math.min(item.itemTotal, itemProportionalDiscount)

            item.itemTotal += appliedDiscount

            remainingDiscount -= appliedDiscount
        });

        if(remainingDiscount > 0){
            let maxItem = cart.items.reduce((prev,curr)=> prev.itemTotal > curr.itemTotal ? prev: curr)
            maxItem.itemTotal += remainingDiscount
        }

        delete req.session.coupon

        await cart.save()

        return res.json({success:true,message:'coupon removed'})

    } catch (error) {
        console.log('something went wrong',error)
    }
}