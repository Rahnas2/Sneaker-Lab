
const productCollection = require('../models/productModel')
const variantCollection = require('../models/variantModel')
const cartCollection = require('../models/cartModel')
const shippingService = require('../services/applyShippingCharge')
const variantModel = require('../models/variantModel')
const mongoose = require('mongoose')
const HttpStatusCode = require('../utils/statsCode')


exports.getCart = async (req, res, next) => {
    try {

        userId = req.session.user //user id

        //cart
        const cart = await cartCollection.findOne({ userId: userId }).populate([
            { path: 'items.product' },
            { path: 'items.variant' }
        ])


        const couponDiscount = req.session.coupon ? req.session.coupon.couponDiscount : 0    //coupon

        if (cart && cart.items.length > 0) {
            cart.items.forEach(item => {
                // Check if the product has a valid offer
                const product = item.product;
                const variant = item.variant
                console.log('variant in cart ', variant)
                if (product.offer && product.offer.expirAt && new Date(product.offer.expirAt) >= new Date()) {
                    // Calculate the offer price
                    const originalPrice = variant.price;
                    const discount = product.offer.discountPercentage;
                    item.itemTotal = Math.round(originalPrice - (originalPrice * discount / 100)) * item.quantity;
                } else {
                    // No offer, use the original price
                    item.itemTotal = variant.price * item.quantity;
                }
            });
            await cart.save()
        }


        res.render('User/cart', {
            user: req.session.user,
            page: null,
            cart,
            couponDiscount
        })
    } catch (error) {
        next(error)
    }

}

exports.addToCart = async (req, res, next) => {
    try {
        const userId = req.session.user
        const productId = req.params.id

        const product = await productCollection.findById(productId)
        if (!product) {
            return res.status(HttpStatusCode.NOT_FOUND).json({ message: 'product not found' })
        }

        const quantity = req.body.quantity || 1
        const itemTotal = req.body.itemTotal
        const variantId = req.body.variantId || product.variants[0]

        const variant = await variantCollection.findById(variantId)
        if (!variant) {
            return res.status(HttpStatusCode.NOT_FOUND).json({ message: 'variant not found' })
        }

        const size = req.body.size || variant.sizes[0].size

        const cart = await cartCollection.findOne({ userId: userId }).populate({
            path: 'items.product'
        })
        if (cart) {
            //user already have cart
            let productCheck = cart.items.find(item => item.product._id.toString() === productId.toString())

            if (productCheck) {
                //product exsists in the cart
                return res.json({ productExist: true, message: 'GO TO CART' })
            } else {
                cart.items.push({ product: productId, variant: variantId, quantity, itemTotal, size })
                await cart.save()

                //apply shipping fee
                await shippingService.applyShippingCharge(userId, cart.totalPrice)

                return res.json({ success: true, message: 'Added to cart' })
            }

        } else {
            //if user dont have cart, so create new cart
            const newCart = await cartCollection.create({
                userId,
                items: [{ product: productId, variant: variantId, quantity, itemTotal, size }],
            })

            await shippingService.applyShippingCharge(userId, newCart.totalPrice)

            return res.json({ success: true, message: 'Added to cart' })
        }
    } catch (error) {
        console.error('add to cart error ', error)
        next(error)
    }
}

exports.deleteCartItem = async (req, res, next) => {
    try {
        //user id
        const userId = req.session.user

        //item id
        const itemsId = req.params.id

        //find cart
        const cart = await cartCollection.findOne({ userId: userId })

        // updated totalQuantity
        const updatedQuantity = cart.totalQuantity - 1

        //update items and updated cart quantity
        await cartCollection.updateOne(
            { userId: userId },
            {
                $pull: { items: { _id: itemsId } },
                $set: { totalQuantity: updatedQuantity },
            }
        )

        //update cart total
        const currentCart = await cartCollection.findOne({ userId: userId })
        const updatedCartTotal = currentCart.items.reduce((acc, curr) => {
            acc += curr.itemTotal
            return acc
        }, 0)

        //apply shipping fee
        await shippingService.applyShippingCharge(userId, updatedCartTotal)


        // const discountedTotal = updatedCartTotal - couponDiscount 
        await cartCollection.updateOne(
            { userId: userId },
            {
                $set: {
                    totalPrice: updatedCartTotal,
                    // discountedTotal:discountedTotal
                }
            }
        )

        const updatedCart = await cartCollection.find({ userId: userId }).populate([
            { path: 'items.product' },
            { path: 'items.variant' }
        ])

        return res.json({ success: true, updatedCart: updatedCart })
    } catch (error) {
        next(error)
    }
}

exports.updatedCartQuantity = async (req, res, next) => {
    try {
        const userId = req.session.user

        const { itemId, quantity, itemTotal } = req.body

        //converting to object id
        const cartItemId = new mongoose.Types.ObjectId(itemId)


        //update quantity and item total
        await cartCollection.updateOne(
            { 'items._id': cartItemId },
            {
                $set: {
                    'items.$.quantity': quantity,
                    'items.$.itemTotal': itemTotal
                }
            }

        )

        const cart = await cartCollection.findOne({ userId: userId })

        // update cart total
        const updatedCartTotal = cart.items.reduce((acc, curr) => {
            acc += curr.itemTotal
            return acc
        }, 0)

        await cartCollection.updateOne({ userId: userId },
            {
                $set: { totalPrice: updatedCartTotal }
            })

        //apply shipping fee
        await shippingService.applyShippingCharge(userId, updatedCartTotal)

        const updatedCart = await cartCollection.find({ userId: userId }).populate([
            { path: 'items.product' },
            { path: 'items.variant' }
        ])

        return res.json({ success: true, updatedCart: updatedCart })


    } catch (error) {
        next(error)
    }
}


