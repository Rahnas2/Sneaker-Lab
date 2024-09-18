
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
        const userId = req.session.user

        const coupon = await couponCollection.findOne({code:couponCode})
        const couponId = coupon._id
        console.log('coupon id',couponId)
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
                couponDiscount = subTotal - maxAmount
             }

             discountedTotal = subTotal - couponDiscount

             await cartCollection.updateOne(
                {userId},
                {
                    $set:{
                        couponDiscount:couponDiscount,
                        couponId:couponId
                    }
                }
            )

            return res.json({success:true,couponDiscount,couponCode})
             
        }else{
            return res.json({notValid:true,message:'sorry, invlalid coupon'})
        }
    } catch (error) {
        console.error('something went wrong',error)
    }
}