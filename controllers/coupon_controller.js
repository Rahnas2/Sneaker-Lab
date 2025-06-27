
const couponCollection = require('../models/couponModel')
const cartCollection = require('../models/cartModel')

const { validationResult } = require('express-validator')
const HttpStatusCode = require('../utils/statsCode')


exports.couponManagment = async (req, res) => {
    try {

        const searchQuery = req.query.search || ''
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const skip = (page - 1) * limit

        const searchCriteria = { code: new RegExp(searchQuery, 'i') }

        const coupansList = await couponCollection.find(searchCriteria).skip(skip).limit(limit)

        const totalCoupons = await couponCollection.countDocuments()     //total coupons
        const totalPages = Math.ceil(totalCoupons / limit)                 //total pages

        res.render('Admin/couponManagment', {
            coupansList,
            currentPage: page,
            totalPages,
            limit,
            searchQuery
        })
    } catch (error) {
        console.error('something went wrong', error)
    }
}

exports.addCoupon = async (req, res) => {
    try {
        const { code, discountPercentage, maxAmount, minimumSpend, endDate } = req.body

        //validation
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            const validationErrors = errors.array().reduce((acc, error) => {
                acc[error.path] = error.msg
                return acc
            }, {})
            console.log('validation error', validationErrors)
            return res.status(HttpStatusCode.BAD_REQUEST).json({ validationError: true, validationErrors })
        }

        const existingCoupon = await couponCollection.findOne({ code: code })

        //checking the coupon is already existed 
        if (existingCoupon) {
            return res.json({ existedCoupon: true, message: 'sorry, this coupon already exist' })
        }

        //create coupon
        await couponCollection.create(req.body)
        return res.status(HttpStatusCode.CREATED).json({ success: true, message: 'coupon added successfully' })

    } catch (error) {
        console.error('sometihng went wrong', error)
    }
}

exports.editCoupon = async (req, res) => {
    try {
        //validation
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            const validationErrors = errors.array().reduce((acc, error) => {
                acc[error.path] = error.msg
                return acc
            }, {})
            console.log('validation error', validationErrors)
            return res.status(HttpStatusCode.BAD_REQUEST).json({ validationError: true, validationErrors })
        }

        const couponId = req.params.id
        const { code, discountPercentage, maxAmount, minimumSpend, endDate } = req.body

        // Verify CouponCode is Unique
        const couponCodeCheck = await couponCollection.findOne({
            code: { $regex: new RegExp(`^${code}$`, 'i') }, 
            _id: { $ne: couponId }
        });
        if(couponCodeCheck){
            return res.json({ existedCoupon: true, message: 'sorry, this coupon already exist' })
        }

        const updatedCoupon = await couponCollection.findByIdAndUpdate(
            couponId,
            {
                code,
                discountPercentage,
                maxAmount,
                minimumSpend,
                endDate,
                isActive: true
            },
            { new: true }
        )

        if (!updatedCoupon) {
            return res.status(HttpStatusCode.NOT_FOUND).json({ success: false, message: 'Coupon not found' })
        }

        return res.json({ success: true, message: 'successfully updated the coupon' })


    } catch (error) {
        console.error('something went wrong', error)
    }
}


exports.couponDelete = async (req, res) => {
    try {
        couponId = req.params.id

        await couponCollection.deleteOne({ _id: couponId })

        return res.json({ success: true, message: 'coupon deleted successfully' })

    } catch (error) {
        console.error('something went wrong', error)
        return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).josn({ success: false, message: 'something went wrong while deleting the coupon' })
    }
}

exports.applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body
        console.log('coupon code', req.body)
        const userId = req.session.user

        const coupon = await couponCollection.findOne({ code: couponCode })

        const cart = await cartCollection.findOne({ userId })


        if (!cart) {
            return res.json({ success: false, message: 'sorry, cart not found' })
        }


        if (coupon) {
            if (!coupon.isActive) {
                return res.json({ success: false, message: 'sorry, coupon expired' })
            }

            const maxAmount = coupon.maxAmount

            const minimumSpend = coupon.minimumSpend

            if (cart.totalPrice < minimumSpend) {
                return res.json({ success: false, message: `sorry, you are not able to use this coupon your total should be greater than or equals ${coupon.minimumSpend}` })
            }

            const subTotal = cart.totalPrice - cart.shippingFee
            const discountPercentage = coupon.discountPercentage

            let couponDiscount = subTotal * (discountPercentage / 100)

            if (couponDiscount > maxAmount) {
                couponDiscount = maxAmount
            }


            let remainigDiscount = couponDiscount
            cart.items.forEach(item => {
                //proportional discount per items using the subtotal
                const itemProportionalDiscount = Math.round((item.itemTotal / subTotal) * couponDiscount)

                const discountToApply = Math.min(item.itemTotal, itemProportionalDiscount)
                console.log('discounted price', discountToApply)

                item.itemTotal -= discountToApply

                remainigDiscount -= discountToApply
                item.markModified('itemTotal');
            });

            if (remainigDiscount > 0) {
                let maxItem = cart.items.reduce((prev, curr) => prev.itemTotal > curr.itemTotal ? prev : curr)
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
                code: couponCode,
                couponDiscount: couponDiscount,
                cartTotal: subTotal
            }

            console.log('session coupon', typeof req.session.coupon)
            console.log('discount type', typeof req.session.coupon.couponDiscount)

            return res.json({ success: true, message: 'coupon applied successfully' })

        } else {
            return res.json({ notValid: true, message: 'sorry, invlalid coupon' })
        }
    } catch (error) {
        console.error('something went wrong', error)
    }
}

exports.userRemoveCoupon = async (req, res) => {
    try {
        const userId = req.session.user
        const couponCode = req.session.coupon.code
        const couponDiscount = req.session.coupon.couponDiscount
        console.log('type of discount', couponDiscount)
        const appliedCoupon = await couponCollection.findOne({ code: couponCode })

        const cart = await cartCollection.findOne({ userId: userId })

        let remainingDiscount = couponDiscount
        const orignalCartTotal = req.session.coupon.cartTotal

        cart.items.forEach(item => {
            const itemProportionalDiscount = (item.itemTotal / orignalCartTotal) * couponDiscount

            const appliedDiscount = Math.min(item.itemTotal, itemProportionalDiscount)

            item.itemTotal += appliedDiscount

            remainingDiscount -= appliedDiscount
        });

        if (remainingDiscount > 0) {
            let maxItem = cart.items.reduce((prev, curr) => prev.itemTotal > curr.itemTotal ? prev : curr)
            maxItem.itemTotal += remainingDiscount
        }

        delete req.session.coupon

        await cart.save()

        return res.json({ success: true, message: 'coupon removed' })

    } catch (error) {
        console.log('something went wrong', error)
    }
}