const { validationResult } = require('express-validator')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const auth_controller = require('./auth_controller')
const usersCollection = require('../models/usersModel')
const otpCollection = require('../models/otpModel')
const categoryCollection = require('../models/categoryModel')
const brandCollection = require('../models/brandModel')
const productCollection = require('../models/productModel')
const variantCollection = require('../models/variantModel')
const cartCollection = require('../models/cartModel')
const addressCollection = require('../models/addressModel')
const orderCollection = require('../models/orderModel')
const couponCollection = require('../models/couponModel')
const walletCollection = require('../models/walletModel')

const shippingService = require('../services/applyShippingCharge')
const invoiceService = require('../services/invoiceDownload')

const mongoose = require('mongoose')
const { render } = require('ejs')
const { set } = require('../config/email')
const { json } = require('body-parser')

const Razorpay = require('razorpay')
const { error } = require('console')

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})




exports.home = async (req, res) => {
    try {
        //user id
        const userId = req.session.user

        if (userId) {
            const status = await usersCollection.findById(userId)
            if (status && status.isBlock) {
                return res.redirect('/signup')
            }
        }

        const products = await productCollection.find()

        let productsInCart = {}

        for (let product of products) {
            let productId = product._id
            const cart = await cartCollection.findOne({ userId, 'items.product': productId })

            productsInCart[productId] = cart ? true : false
        }


        //new arrivels 
        const newArrivals = await productCollection.find().populate('variants')
            .sort({ createdAt: -1 }).limit(4)

        //average rating
        let averageRating = {}
        newArrivals.forEach((product, index) => {
            let rating = 0
            product.review.forEach(review => {
                rating += review.rating
            })
            const avg = rating / product.review.length
            averageRating[product._id] = Math.ceil(avg)
        })
        


        return res.render("User/index", {
            user: req.session.user,
            page: 'home',
            newArrivals,
            productsInCart,
            averageRating
        })
    } catch (error) {
        return res.status(500).json('someting went wrong',error)
    }
}

//=========login start=========// 

exports.login = async (req, res) => {
    const userId = req.session.user
    const status = await usersCollection.findById(userId)
    if (!status || status.isBlock) {
        return res.render('User/signin')
    }
    else {
        res.redirect('/')
    }
}
exports.postlogin = async (req, res) => {

    const { email, password } = req.body
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const validationErrors = errors.array().reduce((acc, error) => {
            acc[error.path] = error.msg;
            return acc;
        }, {})
        return res.json({ validationError: true, validationErrors })
    }
    userCheck = await usersCollection.findOne({ email: email, isBlock: false })
    if (!userCheck) {
        return res.json({ error: 'invalid user' });
    }

    if (userCheck.googleId) {
        return res.json({ error: 'You signed up using Google. Please use Google Sign-In to access your account.' })
    }
    if (userCheck) {
        const passCheck = await bcrypt.compare(password, userCheck.password)
        if (passCheck) {
            req.session.user = userCheck._id
            return res.json({ success: true })

        } else {
            return res.json({ error: 'wrong password' })

        }
    }
}




//=========login end=========// 



//=========signup start=========// 

exports.signup = (req, res) => {
    res.render('User/signup')
}

exports.postsignup = async (req, res) => {
    const data = {
        username: req.body.username,
        email: req.body.email,
        phone: req.body.phone,
        password: req.body.password,
        cfpassword: req.body.cfpassword, //This is for checking the password not store into database 
        refereeCode: req.body.referralCode
    }

    //validation
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        
        const validationErrors = errors.array().reduce((acc, error) => {
            acc[error.path] = error.msg
            return acc
        }, {})
        return res.json({ validationError: true, validationErrors })
    } else {
        const user_check = await usersCollection.findOne({ email: data.email })
        if (user_check) {
            return res.json({ emailError: 'user is already existed' })
        } else if (data.password != data.cfpassword) {
            return res.json({ passError: 'please enter correct password' })
        } else {
            req.session.tempUser = {
                username: data.username,
                email: data.email,
                phone: data.phone,
                password: data.password,
                refereeCode: data.refereeCode
            };
            return res.json({ success: true })
        }
    }
}

//=========otp verification start=========// 

exports.getsignupVerification = async (req, res) => {
    const userData = req.session.tempUser
    if (!userData) {
        return res.redirect('/signup')

    }
    const otp = auth_controller.generateOtp()
    console.log(otp)

    await auth_controller.sendOtp(userData.email, otp)
    const otpExpiryTime = 30 * 1000
    res.render('User/otpVerify', {
        email: userData.email,
        timerDuration: Math.ceil(otpExpiryTime / 1000)
    })
}

exports.signupVerification = async (req, res) => {
    const { email, otp } = req.body

    const otpCheck = await otpCollection.findOne({ email, otp })

    if (otpCheck && new Date() < otpCheck.expiresAt) {
        const userData = req.session.tempUser
        if (!userData) {
            res.render('User/otpVerify', {
                error: 'session expired please try again',
                email: email
            })
        }
        //hahsPassword
        const hashedPassword = await bcrypt.hash(userData.password, 10)
        userData.password = hashedPassword

        //generate referal code
        const userName = userData.username.slice(0, 3)

        const code = auth_controller.generateReferralCode()

        const referralCode = userName + code

        userData.referralCode = referralCode


        const refereeCode = userData.refereeCode //store referee code before delete

        delete userData.refereeCode  //delete the refereee code before save userData to database


        const newUser = await usersCollection.create(userData)
        req.session.user = newUser._id

        // add referal bonus to referal user
        const findReferraUser = await usersCollection.findOne({ referralCode: refereeCode })
        if (findReferraUser) {
            referalUserId = findReferraUser._id
            const referralUserWallet = await walletCollection.findOne({ userId: referalUserId })
            if (!referralUserWallet) {
                await walletCollection.create({
                    userId: referalUserId,
                    balance: 100,
                    history: [{ amount: 100, status: 'credit', description: `Credited ${100} via referral` }]
                })
            } else {
                await walletCollection.updateOne(
                    { userId: referalUserId },
                    {
                        $inc: { balance: 100 }, // Increment the wallet balance
                        $push: {
                            history: { amount: 1000, status: 'credit', description: `Credited ${100} via referral` }
                        }
                    }
                )
            }
        }

        res.redirect('/')
    } else {
        const reminingTime = otpCheck ? Math.ceil((otpCheck.expiresAt - new Date()) / 1000) : 0;
        res.render('User/otpVerify', {
            error: 'invalid otp',
            email: email,
            timerDuration: reminingTime > 0 ? reminingTime : 0

        })
    }
}

exports.resendOtp = async (req, res) => {
    try {
        const userData = req.session.tempUser
        const otp = auth_controller.generateOtp();

        await auth_controller.sendOtp(userData.email, otp); // Send a new OTP

        const otpExpiryTime = 30 * 1000
        res.render('User/otpVerify', {
            email: userData.email,
            timerDuration: Math.ceil(otpExpiryTime / 1000), // Reset timer to 1 minutes
            error: 'A new OTP has been sent to your email.'
        });
    } catch (error) {
        return res.status(500).json('someting went wrong',error)
    }

};

//=========otp verification end=========// 

//=========user signup end=========// 


//=========forgotPasword end=========// 

exports.emailVerification = (req, res) => {
    try {
        res.render('User/emailVerification')
    } catch (error) {
        return res.status(500).json('something went wrong',error)
    }
}

exports.postEmailVerification = async (req, res) => {
    try {
        const { email } = req.body

        const user = await usersCollection.findOne({ email: email })
        if (user) {
            if (user.googleId) {
                return res.json({ googleUser: true, message: 'You signed up using Google. Please use Google Sign-In to access your account.' })
            }

            const otp = auth_controller.generateOtp()


            await auth_controller.sendOtp(email, otp)
            const otpExpiryTime = 30 * 1000

            req.session.emailAuth = email

            return res.json({ success: true })
        }
        return res.json({ inValidEmail: true, message: 'invalid email' })

    } catch (error) {
        return res.status(500).json('sometihng went wrong',error)
    }
}


exports.getOtpVerificationFrg = (req, res) => {
    try {
        res.render('User/otpVerifyFrg')
    } catch (error) {
        console.error('something went wrong', error)
    }
}

exports.postOtpVerifyFrg = async (req, res) => {
    try {
        const email = req.session.emailAuth
        const { otp } = req.body
        if (!email) {
            return res.json({ error: true, message: 'email not found' })
        }

        const otpCheck = await otpCollection.findOne({ email, otp })
        if (otpCheck && new Date() < otpCheck.expiresAt) {
            return res.json({ success: true })
        }

        return res.json({ error: true, message: 'invalid otp' })


    } catch (error) {
        console.error('something went wrong', error)
    }
}

exports.resendOtpFrg = async (req, res) => {
    const email = req.session.emailAuth;
    if (!email) {
        return res.json({ error: true, message: 'Email not found' });
    }

    try {

        const otp = auth_controller.generateOtp()

        await auth_controller.sendOtp(email, otp)

        res.json({ success: true, message: 'A new OTP has been sent to your email' });
    } catch (error) {
        console.error('Error resending OTP', error);
        res.json({ error: true, message: 'Failed to resend OTP' });
    }
};


exports.changePassword = (req, res) => {
    try {
        res.render('User/changePassword')
    } catch (error) {
        console.error('something went wrong', error)
    }
}

exports.PostchangePassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body
        const email = req.session.emailAuth
        const user = await usersCollection.findOne({ email: email })
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        await user.save()
        return res.json({ success: true })

    } catch (error) {
        return res.status(500).json('sometihng went wrong',error)
    }
}


//=========forgot Pasword end=========// 

//=========shope page start=========// 
exports.getShop = async (req, res) => {
    try {
        const categories = await categoryCollection.find({ deleted: false })
        const brands = await brandCollection.find({ deleted: false })

        const userId = req.session.user          //users id

        const filter = req.query.filter          //filter type

        const search = req.query.search || ''    //search

        //for pagination
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const skip = (page - 1) * limit

        //category filtering start
        const selectedCategory = req.query.category || ''
        let categoryFilter = {}
        if (selectedCategory) {
            const findCategory = await categoryCollection.findOne({ categoryName: selectedCategory, deleted: false })
            if (findCategory) {
                const selectedCategoryId = findCategory._id
                categoryFilter = { category: selectedCategoryId }
            }
        }
        //category filtering end

        //brand filtering start
        const selectedBrand = req.query.brand || ''
        let brandFilter = {}
        if (selectedBrand) {
            const findBrand = await brandCollection.findOne({ brandName: selectedBrand, deleted: false })
            if (findBrand) {
                const selectedBrandId = findBrand._id
                brandFilter = { brand: selectedBrandId }
            }
        }
        //brand filtering end

        let sortOption = {};


        switch (filter) {
            case 'price-low-high':
                sortOption = { minPrice: 1 };
                break;
            case 'price-high-low':
                sortOption = { minPrice: -1 };
                break;
            case 'new-arrivals':
                sortOption = { createdAt: -1 };
                break;
            case 'a-z':
                sortOption = { productName: 1 };
                break;
            case 'z-a':
                sortOption = { productName: -1 };
                break;
            default:
                sortOption = null;
        }

        const aggregationPipeline = [
            { $match: { deleted: false, ...categoryFilter, ...brandFilter } },
            {
                $lookup: {
                    from: 'variants',
                    localField: 'variants',
                    foreignField: '_id',
                    as: 'variants'
                }
            },
            {
                $addFields: {
                    minPrice: { $min: '$variants.price' }
                }
            }
        ];

        if (search) {
            aggregationPipeline.unshift({
                $match: {
                    productName: { $regex: search, $options: 'i' } // Case-insensitive search
                }
            });
        }

        if (sortOption) {
            aggregationPipeline.push({ $sort: sortOption });
        }


        const allProducts = await productCollection.aggregate(aggregationPipeline)
        const totalProducts = allProducts.length

        const products = await productCollection.aggregate(aggregationPipeline).skip(skip).limit(limit)

        const totalPages = Math.ceil(totalProducts / limit)

        let productsInCart = {}
        for (let product of products) {
            let productId = product._id
            const cart = await cartCollection.findOne({ userId, 'items.product': productId })

            productsInCart[productId] = cart ? true : false
        }

        //average rating
        let averageRating = {}
        products.forEach((product, index) => {
            let rating = 0
            product.review.forEach(review => {
                rating += review.rating
            })
            const avg = rating / product.review.length
            averageRating[product._id] = Math.ceil(avg)
        })
        

        res.render('User/shop', {
            user: req.session.user,
            page: 'shop',
            categories,
            brands,
            products,
            productsInCart,
            filter,
            search,
            selectedCategory,
            selectedBrand,
            totalPages,
            page,
            limit,
            averageRating
            // selectedCategory
        })

    } catch (error) {
        console.log('error', error)
    }
}

//=========shope page end=========// 

//=========view product start=========// 
exports.getViewProduct = async (req, res) => {
    try {
        const productId = req.params.id

        const userId = req.session.user

        const product = await productCollection.findOne({ _id: productId }).populate('variants')

        const cart = await cartCollection.findOne({ userId: userId, 'items.product': productId })
        const productInCart = cart ? true : false

        const review = product.review

        const totalStars = review.reduce((acc,curr) =>  acc += curr.rating ,0)
        
        const avgRating = Math.ceil(totalStars / review.length)

        res.render('User/viewProduct', {
            user: req.session.user,
            page: 'shope',
            product,
            productInCart,
            review,
            avgRating
        })
    } catch (error) {
        console.log('error', error)
    }

}
//=========view product end=========// 

//=========cart start=========// 

exports.getCart = async (req, res) => {
    try {

        userId = req.session.user //user id

        //cart
        const cart = await cartCollection.findOne({ userId: userId }).populate({
            path: 'items.product',
            populate: {
                path: 'variants'
            }
        })


        const couponDiscount = req.session.coupon ? req.session.coupon.couponDiscount : 0    //coupon

        if (cart && cart.items.length > 0) {
            cart.items.forEach(item => {
                // Check if the product has a valid offer
                const product = item.product;
                if (product.offer && product.offer.expirAt && new Date(product.offer.expirAt) >= new Date()) {
                    // Calculate the offer price
                    const originalPrice = product.variants[0].price;
                    const discount = product.offer.discountPercentage;
                    item.itemTotal = Math.round(originalPrice - (originalPrice * discount / 100)) * item.quantity;
                } else {
                    // No offer, use the original price
                    item.itemTotal = product.variants[0].price * item.quantity;
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
        console.log('something went wrong', error)
    }

}

exports.addToCart = async (req, res) => {
    try {
        const userId = req.session.user
        const product = req.params.id
        const quantity = req.body.quantity || 1
        const itemTotal = req.body.itemTotal

        const cart = await cartCollection.findOne({ userId: userId }).populate({
            path: 'items.product',
            populate: {
                path: 'variants'
            }
        })
        if (cart) {
            //user already have cart
            let productCheck = cart.items.find(item => item.product._id.toString() === product.toString())

            if (productCheck) {
                //product exsists in the cart
                return res.json({ productExist: true, message: 'GO TO CART' })
            } else {
                cart.items.push({ product, quantity, itemTotal })
                await cart.save()

                //apply shipping fee
                await shippingService.applyShippingCharge(userId, cart.totalPrice)

                return res.json({ success: true, message: 'Added to cart' })
            }

        } else {
            //if user dont have cart, so create new cart
            const newCart = await cartCollection.create({
                userId,
                items: [{ product, quantity, itemTotal }],
            })

            await shippingService.applyShippingCharge(userId, newCart.totalPrice)

            return res.json({ success: true, message: 'Added to cart' })
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'sever error' })
    }
}

exports.deleteCartItem = async (req, res) => {
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

        const updatedCart = await cartCollection.find({ userId: userId }).populate({
            path: 'items.product',
            populate: {
                path: 'variants'
            }
        })

        return res.json({ success: true, updatedCart: updatedCart })
    } catch (error) {
        return res.status(500).json('something went wrong',error)
        console.log('something went wrong', error)
    }
}

exports.updatedCartQuantity = async (req, res) => {
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

        const updatedCart = await cartCollection.find({ userId: userId }).populate({
            path: 'items.product',
            populate: {
                path: 'variants'
            }
        })

        return res.json({ success: true, updatedCart: updatedCart })


    } catch (error) {
        console.error('Error updating quantity:', error.message);
        console.error('Error stack:', error.stack);
    }
}

//=========cart end=========// 

//=========profile start=========// 

exports.getProfile = async (req, res) => {
    try {
        const userId = req.session.user

        const user = await usersCollection.findById(userId)

        const address = await addressCollection.findOne({ userId: userId })

        const orders = await orderCollection.find({ userId: user }).sort({ createdAt: -1 })

        const wallet = await walletCollection.findOne({ userId: userId })

        if (wallet) {
            wallet.history.reverse()
        }

        return res.render('User/profile', {
            user,
            address,
            orders,
            wallet,
            page: null
        })
    } catch (error) {
        console.error('something went wrong')
    }
}

exports.editProfile = async (req, res) => {
    try {
        //validation
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            const validationErrors = errors.array().reduce((acc, error) => {
                acc[error.path] = error.msg;
                return acc;
            }, {})
            return res.json({ validationError: true, validationErrors })
        }
        const userId = req.session.user
        const { username, phone } = req.body
        const user = await usersCollection.findById(userId)

        if (user.username === username && user.phone === phone) {
            return res.json({ noChange: true, message: 'sorry you didit make any changes' })
        }
        else {
            user.username = username
            user.phone = phone

            await user.save()

            return res.json({ success: true, message: 'successfully updated your profile' })
        }

    } catch (error) {
        return res.status(500).json('something went wrong',error)
    }
}


exports.setNewPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.user
    const user = await usersCollection.findById({ _id: userId });

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
        return res.json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });

}

exports.addAddress = async (req, res) => {
    try {
        req.session.source = req.query.profile

        user = req.session.user
        currAddress = null
        return res.render('User/addAddress', {
            user,
            page: null,
            currAddress
        })
    } catch (error) {
        console.log('something went wron', error)
    }
}

exports.postAddress = async (req, res) => {
    try {
        const source = req.session.source
        //validation 
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            const validationErrors = errors.array().reduce((acc, error) => {
                acc[error.path] = error.msg
                return acc
            }, {})
            return res.json({ validationError: true, validationErrors })
        }

        const userId = req.session.user


        const newAddress = {
            fullName: req.body.fullName,
            country: req.body.country,
            localAddress: req.body.localAddress,
            city: req.body.city,
            state: req.body.state,
            pinCode: req.body.pincode,
            mobile: req.body.mobile,
            email: req.body.email,
            typeOfAddress: req.body.typeOfAddress,
            isDefault: req.body.defaultAddress || false
        }

        const address = await addressCollection.findOne({ userId: userId })

        //user dont have any address
        if (!address) {
            newAddress.isDefault = true
            await addressCollection.create({ userId: userId, addresses: [newAddress] })
            return res.json({ success: true, message: 'address added successfully', source })
        }

        if (address.addresses.length === 3) {
            return res.json({ success: false, message: 'sorry you cannot add more than three address!', source })
        }

        if (newAddress.isDefault) {
            address.addresses.forEach((addr) => (addr.isDefault = false))
            newAddress.isDefault = true
        }

        //adding multiple address
        address.addresses.push(newAddress)
        await address.save()
        return res.json({ success: true, message: 'address added successfully', source })

    } catch (error) {
        console.error('somethig went wrong', error)
    }
}


exports.getEditAddress = async (req, res) => {
    try {
        req.session.source = req.query.profile
        user = req.session.user
        addressId = req.params.id
        const address = await addressCollection.findOne({ userId: user })
        if (address) {
            const currAddress = address.addresses.find(element => element._id.toString() == addressId)

            res.render('User/addAddress', {
                user,
                page: null,
                currAddress
            })

        }

    } catch (error) {
        console.error('something went wrong', error)
    }
}

exports.editAddressPost = async (req, res) => {
    try {
        const source = req.session.source
        //validation errror
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            const validationErrors = errors.array().reduce((acc, error) => {
                acc[error.path] = error.msg
                return acc
            }, {})
            return res.json({ validationError: true, validationErrors })
        }

        addressId = req.params.id
        userId = req.session.user


        const address = await addressCollection.findOne({ userId: userId })
        if (address) {
            const editedAddress = address.addresses.find(element => element._id.toString() === addressId)
            if (editedAddress) {
                editedAddress.fullName = req.body.fullName,
                    editedAddress.country = req.body.country,
                    editedAddress.localAddress = req.body.localAddress,
                    editedAddress.city = req.body.city,
                    editedAddress.state = req.body.state,
                    editedAddress.pinCode = req.body.pincode,
                    editedAddress.mobile = req.body.mobile,
                    editedAddress.email = req.body.email,
                    editedAddress.typeOfAddress = req.body.typeOfAddress

                if (req.body.defaultAddress) {
                    // Unset other default addresses
                    address.addresses.forEach((addr) => {
                        if (addr._id.toString() !== addressId) addr.isDefault = false;
                    });
                    editedAddress.isDefault = true;
                }

                // await editedAddress.save()
                await address.save()

                return res.json({ success: true, message: 'successfuly updated the address', source })
            }
            return res.status(404).json({ success: false, message: 'address not found', source })
        } else {
            return res.status(404).json({ success: false, message: 'user document not found', source })
        }
    } catch (error) {
        console.error('something went wrong', error)
    }
}

exports.deleteAddress = async (req, res) => {
    try {
        const userId = req.session.user
        const addressId = req.params.id
        const address = await addressCollection.findOne({ userId: userId })
        if (address) {
            const currAddress = address.addresses.find(element => element._id.toString() === addressId)
            if (currAddress) {
                const isDefault = currAddress.isDefault
                address.addresses.pull(currAddress._id)

                //if the deleted address was a default address
                if (isDefault && address.addresses.length > 0) {
                    address.addresses[0].isDefault = true;
                }

                await address.save()
                return res.json({ success: true, message: 'successfully deleted the address' })
            }

            return res.status(404).json({ success: false, message: 'address not found' })
        }
        return res.status(404), json({ success: false, message: 'address document not found' })

    } catch (error) {
        console.error('something went wrong', error)
    }
}


exports.orderDetail = async (req, res) => {
    try {
        orderId = req.params.id
        const order = await orderCollection.findOne({ _id: orderId })
        // console.log('order',order)
        res.render('User/orderDetail', {
            order,
            user: true,
            page: null
        })
    } catch (error) {
        console.error('error', error)
        return res.status(500).json({ success: false, message: 'error', error })
    }
}

exports.downloadInvoice = (req, res) => {
    try {
        const { orderId } = req.query

        invoiceService.invoiceDownload(res, orderId)
    } catch (error) {
        console.error('something went wrong', error)
        return res.status(500).json({ success: false, message: 'somethng went wrong', error })
    }
}

exports.cancelProduct = async (req, res) => {
    try {
        const { orderId, itemId } = req.body

        const orders = await orderCollection.findOne({ _id: orderId })

        if (!orders) {
            return res.json({ success: false, message: 'Order not found' });
        }

        const itemIndex = orders.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.json({ success: false, message: 'Item not found in order' });
        }


        const { variantId, quantity } = orders.items[itemIndex];


        const variant = await variantCollection.findOne({ _id: variantId });
        if (!variant) {
            return res.status(500).json({ success: false, message: 'Variant not found' });
        }


        variant.sizes[0].stock += quantity;

        // Save the updated variant
        await variant.save();

        const { status } = orders.items[itemIndex]


        if (status === 'order placed' || status === 'pending') {

            await orderCollection.findOneAndUpdate(
                { _id: orderId, 'items._id': itemId },
                { $set: { 'items.$.status': 'canceled' } },
                { new: true }
            )
        } else {
            return res.status.json({ success: false, message: 'sorry, please make sure your product is not delivered' })
        }

        // handinling wallet refunds for online or wallet payment methods
        if (orders.paymentMethod === 'RAZORPAY' || orders.paymentMethod === 'WALLET') {
            const cancelItem = orders.items[itemIndex]
            const amount = cancelItem.itemTotal

            const wallet = await walletCollection.findOne({ userId: req.session.user })

            // if user dont have wallet create a new one
            if (!wallet) {
                await walletCollection.create({
                    userId: req.session.user,
                    balance: amount,
                    history: [{ amount, status: 'credit', description: `Credited ${amount} for canceled order` }]
                });
            } else {
                // Update the existing wallet
                await walletCollection.updateOne(
                    { userId: req.session.user },
                    {
                        $inc: { balance: amount }, // Increment the wallet balance
                        $push: {
                            history: { amount, status: 'credit', description: `Credited ${amount} for canceled order` }
                        }
                    }
                );
            }


        }

        return res.json({ success: true, message: 'order canceled successfully' })

    } catch (error) {
        console.error('somethig went wrong', error)
        return res.status(500).json({ success: false, message: 'something went wrong' })
    }
}

exports.returnProduct = async (req, res) => {
    try {

        const { orderId, itemId, returnReason } = req.body

        const orders = await orderCollection.findOne({ _id: orderId })

        if (!orders) {
            return res.json({ success: false, message: 'Order not found' });
        }

        const itemIndex = orders.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.json({ success: false, message: 'Item not found in order' });
        }

        await orderCollection.findOneAndUpdate(
            { _id: orderId, 'items._id': itemId },
            {
                $set: { 'items.$.status': 'return requested' },
                'items.$.returnReson': returnReason
            },
            { new: true }
        )

        return res.json({ success: true, message: 'return requested' })

    } catch (error) {
        console.error('something went wrong', error)
        return res.status(500).json({ success: false, message: 'someting went wrong' })
    }
}

//=========profile end=========// 

exports.getCheckOut = async (req, res) => {
    try {
        user = req.session.user
        const cart = await cartCollection.findOne({ userId: user }).populate({
            path: 'items.product',
            populate: {
                path: 'variants'
            }
        })

        if (cart && cart.items.length > 0) {
            cart.items.forEach(item => {

                const product = item.product;
                if (product.offer && product.offer.expirAt && new Date(product.offer.expirAt) >= new Date()) {

                    const originalPrice = product.variants[0].price;
                    const discount = product.offer.discountPercentage;
                    item.itemTotal = Math.round(originalPrice - (originalPrice * discount / 100)) * item.quantity;
                } else {

                    item.itemTotal = product.variants[0].price * item.quantity;
                }
            });

            //if a couon applied
            const appliedCouponCode = req.session.coupon ? req.session.coupon.code : false;
            if (appliedCouponCode) {
                const coupon = await couponCollection.findOne({ code: appliedCouponCode });
                if (coupon && coupon.isActive) {

                    const subTotal = cart.items.reduce((total, item) => total + item.itemTotal, 0);

                    const discountPercentage = coupon.discountPercentage;
                    let couponDiscount = subTotal * (discountPercentage / 100);

                    if (couponDiscount > coupon.maxAmount) {
                        couponDiscount = coupon.maxAmount;
                    }

                    let remainingDiscount = couponDiscount;
                    cart.items.forEach(item => {
                        const itemProportionalDiscount = Math.round((item.itemTotal / subTotal) * couponDiscount);
                        const discountToApply = Math.min(item.itemTotal, itemProportionalDiscount);
                        item.itemTotal -= discountToApply;
                        remainingDiscount -= discountToApply;
                    });

                    if (remainingDiscount > 0) {
                        let maxItem = cart.items.reduce((prev, curr) => (prev.itemTotal > curr.itemTotal ? prev : curr));
                        maxItem.itemTotal -= remainingDiscount;
                    }

                    // req.session.coupon = {
                    //     code: appliedCouponCode,
                    //     couponDiscount: couponDiscount,
                    //     cartTotal: subTotal 
                    // };
                } else {
                    delete req.session.coupon
                }
            }

            await cart.save();

        }



        const address = await addressCollection.findOne({ userId: user })

        const coupons = await couponCollection.find({ isActive: true })
        // const appliedCouponCode = req.session.coupon ? req.session.coupon.code : false 

        const appliedCoupon = req.session.coupon ? await couponCollection.findOne({ code: req.session.coupon.code }) : false;

        const couponDiscount = req.session.coupon ? req.session.coupon.couponDiscount : 0

        res.render('User/checkout', {
            user,
            page: null,
            cart,
            address,
            coupons,
            appliedCoupon,
            couponDiscount
        })
    } catch (error) {
        console.error('somehing went wrong', error)
    }
}

exports.placeOrder = async (req, res) => {
    try {
        const userId = req.session.user
        const { deliveryAddress, paymentMethod } = req.body

        //address
        const address = await addressCollection.findOne({ userId })
        if (!address) {
            return res.json({ error: true, message: 'sorry address not found' })
        }

        const userAddress = address.addresses.find(addr => addr._id.toString() === deliveryAddress)
        if (!userAddress) {
            return res.json({ error: true, message: 'sorry address not found' })
        }

        //payment method
        if (!paymentMethod) {
            return res.json({ error: true, message: 'plese select a payment option' })
        }

        //cart
        const cart = await cartCollection.findOne({ userId: userId }).populate({
            path: 'items.product',
            populate: {
                path: 'variants'
            }
        })

        if (!cart || cart.items.length === 0) {
            console.log('cart is empty')
            return res.json({ error: true, message: 'your cart is empty' })
        } else {
            cart.items.forEach(item => {
                // Check if the product has a valid offer
                const product = item.product;
                if (product.offer && product.offer.expirAt && new Date(product.offer.expirAt) >= new Date()) {
                    // Calculate the offer price
                    const originalPrice = product.variants[0].price;
                    const discount = product.offer.discountPercentage;
                    const offerPrice = Math.round(originalPrice - (originalPrice * discount / 100))
                    item.offerPrice = offerPrice
                    item.itemTotal = Math.round(originalPrice - (originalPrice * discount / 100)) * item.quantity;
                } else {
                    // No offer, use the original price
                    item.itemTotal = product.variants[0].price * item.quantity;
                }
            });

            //if a couon applied
            const appliedCouponCode = req.session.coupon ? req.session.coupon.code : false;
            if (appliedCouponCode) {
                const coupon = await couponCollection.findOne({ code: appliedCouponCode });
                if (coupon && coupon.isActive) {

                    const subTotal = cart.items.reduce((total, item) => total + item.itemTotal, 0);

                    const discountPercentage = coupon.discountPercentage;
                    let couponDiscount = subTotal * (discountPercentage / 100);

                    if (couponDiscount > coupon.maxAmount) {
                        couponDiscount = coupon.maxAmount;
                    }

                    let remainingDiscount = couponDiscount;
                    cart.items.forEach(item => {
                        const itemProportionalDiscount = Math.round((item.itemTotal / subTotal) * couponDiscount);
                        const discountToApply = Math.min(item.itemTotal, itemProportionalDiscount);
                        item.itemTotal -= discountToApply;
                        remainingDiscount -= discountToApply;
                    });

                    if (remainingDiscount > 0) {
                        let maxItem = cart.items.reduce((prev, curr) => (prev.itemTotal > curr.itemTotal ? prev : curr));
                        maxItem.itemTotal -= remainingDiscount;
                    }

                    // req.session.coupon = {
                    //     code: appliedCouponCode,
                    //     couponDiscount: couponDiscount,
                    //     cartTotal: subTotal 
                    // };
                } else {
                    delete req.session.coupon
                }
            }

            await cart.save();
        }

        const orderItems = cart.items.map(item => ({
            productId: item.product._id,
            productName: item.product.productName,
            variantId: item.product.variants[0]._id,
            size: item.product.variants[0].sizes[0].size,
            image: item.product.variants[0].images[0],
            price: item.product.variants[0].price,
            offerPrice: item.offerPrice || item.product.variants[0].price,
            quantity: item.quantity,
            itemTotal: item.itemTotal,
            status: 'order placed'
        }));

        const totalAmount = cart.totalPrice

        const orderDetails = {
            userId,
            deliveryAddress: {
                fullName: userAddress.fullName,
                mobile: userAddress.mobile,
                localAddress: userAddress.localAddress,
                pinCode: userAddress.pinCode,
                country: userAddress.country,
                state: userAddress.state,
                city: userAddress.city,
                typeOfAddress: userAddress.typeOfAddress,
                email: userAddress.email || null,
            },
            items: orderItems,
            couponCode: req.session.coupon ? req.session.coupon.code : null,
            couponDiscount: req.session.coupon ? req.session.coupon.couponDiscount : 0,
            shippingFee: cart.shippingFee,
            paymentMethod,
            // paymentStatus:'pending', 
            totalAmount
        }

        if (req.session.coupon) {
            //delete the coupon session
            delete req.session.coupon
        }


        // if(paymentMethod === 'WALLET'){
        //     wallet = await walletCollection.findOne({userId:userId})
        //     if(wallet.balance < totalAmount){
        //         return res.json({error:true, message:'insufficient balance in your wallet, please try another option'})
        //     }

        // }

        if (paymentMethod === 'RAZORPAY') {

            // const createdOrder = await orderCollection.create(orderDetails)
            // req.session.orderId = createdOrder._id
            req.session.tempOrderDetails = orderDetails

            // await processOrderPostPayment(orderDetails, orderItems)

            const options = {
                amount: totalAmount * 100,
                currency: 'INR',
                receipt: `${userId}_${Date.now()}`,
                payment_capture: 1
            }

            const razorpayOrder = await razorpayInstance.orders.create(options)

            return res.json({
                success: true,
                message: 'please complete the payment',
                // orderId:newOrder._id,
                razorpayOrderId: razorpayOrder.id,
                amount: totalAmount,
                razorpay: true,
                key: process.env.RAZORPAY_KEY_ID
            })
        }

        if (paymentMethod === 'COD') {
            //COD Not allowed for above 1000
            if (orderDetails.totalAmount > 1000) {
                return res.json({ error: true, message: 'sorry cash on delivery is not allowed for above 1000,plese go with another methods' })
            }
            const createdOrder = await orderCollection.create(orderDetails)
            await processOrderPostPayment(orderDetails, orderItems)
            return res.json({ success: true, message: 'order placed successfully' })
        }

    } catch (error) {
        console.error('something went wrong', error)
        return res.json({ error: true, message: 'An error occurred while placing the order' });
    }
}

//function to handle order post logic
async function processOrderPostPayment(order, orderItems) {

    //update the stock
    for (const item of orderItems) {
        await variantCollection.updateOne(
            { _id: item.variantId, "sizes.size": item.size },
            { $inc: { "sizes.$.stock": -item.quantity } }
        );
    }

    //clear user cart
    await cartCollection.findOneAndUpdate({ userId: order.userId }, { $set: { items: [] } });

}

exports.verifyPayment = async (req, res) => {
    try {
        const { paymentId, orderId, signature, failed, isRetry } = req.body

        const orderDetails = req.session.tempOrderDetails
        if (!orderDetails) {
            return res.json({ success: false, message: 'order details not found in the session' })
        }

        let paymentStatus = 'faild'
        let status = 'pending'
        let paymentSuccess = false

        if (!failed) {

            const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(orderId + '|' + paymentId)
                .digest('hex')

            if (generatedSignature === signature) {
                paymentStatus = 'paid'
                status = 'order placed'
                paymentSuccess = true
            }


        }

        //retrying from order detail page
        if (isRetry) {
            await orderCollection.updateOne(
                { _id: orderDetails },
                {
                    $set: {
                        'items.$[].paymentStatus': paymentStatus,
                        'items.$[].status': status
                    }
                }
            )

            delete req.session.tempOrderDetails

            if (paymentSuccess) {
                return res.json({ success: true, message: 'payment successfull' })
            } else {
                return res.json({ success: false, message: 'payment faild' })
            }

        }

        //update payment status
        orderDetails.items.forEach(item => {
            item.paymentStatus = paymentStatus,
                item.status = status
        })

        //create order
        const createdOrder = await orderCollection.create(orderDetails)


        //newly created order id
        const newOrderId = createdOrder._id

        //update the quantity
        const orderItems = orderDetails.items;
        await processOrderPostPayment(orderDetails, orderItems);

        delete req.session.tempOrderDetails

        if (paymentSuccess) {

            return res.json({ success: true, message: 'order placed successfully', orderId: newOrderId })
        } else {
            return res.json({ success: true, messagae: 'payment faild , order created with pending status', orderId: newOrderId })
        }


    } catch (error) {
        console.error('someting went wrong', error)
    }
}

exports.payAfter = async (req, res) => {
    console.log('hello')
    try {
        const { orderId, paymentMethod } = req.body
        const userId = req.session.user


        //order 
        const order = await orderCollection.findOne({ _id: orderId })


        //payment method
        if (!paymentMethod) {
            return res.json({ success: false, message: 'plese select a payment method' })
        }

        if (paymentMethod === 'wallet') {
            const wallet = await walletCollection.findOne({ userId: userId })
            if (!wallet) {
                return res.json({ success: false, message: 'sorry wallet not found' })
            }


            //wallet balance checking
            if (order.totalAmount > wallet.balance) {
                return res.json({ success: false, message: 'Insufficient balance in wallet' })
            }

            //update wallet balance
            await walletCollection.updateOne(
                { userId: userId },
                {
                    $inc: { balance: - order.totalAmount },
                    $push: {
                        history: { amount: order.totalAmount, status: 'debit', description: `${order.totalAmount} debited from wallet` }
                    }
                }
            )

            //update status
            await orderCollection.updateOne(
                { _id: orderId },
                {
                    $set: {
                        'items.$[].paymentStatus': 'paid',
                        'items.$[].status': 'order placed',
                        paymentMethod: paymentMethod
                    }
                }
            )
            return res.json('success')
        }

        req.session.tempOrderDetails = order

        const options = {
            amount: order.totalAmount * 100,
            currency: 'INR',
            receipt: `${userId}_${Date.now()}`,
            payment_capture: 1
        }
        const razorpayOrder = await razorpayInstance.orders.create(options)

        return res.json({
            success: true,
            message: 'please complete the payment',
            razorpayOrderId: razorpayOrder.id,
            amount: order.totalAmount,
            razorpay: true,
            key: process.env.RAZORPAY_KEY_ID
        })




    } catch (error) {
        console.log('something went wrong', error)
        return res.status(500).json('something wnet wrong', error)
    }
}


exports.submitReview = async (req, res) => {
    try {
        const { rating, review, product, item } = req.body
        
        const userId = req.session.user

        //add review to the ordered product
        await orderCollection.updateOne(
            { 'items._id': item },
            {
                $set: { 'items.$.rating': rating }
            }
        )

        //add review to the product
        await productCollection.updateOne(
            { _id: product },
            {
                $push: {
                    review: { rating: rating, comments: review, userId: userId }
                }
            }
        )
        return res.json({ success: true, message: 'Thanks for your feedback', item})

    } catch (error) {
        console.error('something went wrong', error)
        return res.json({ success: false, message: 'something went wrong' })
    }
}

exports.userLogout = async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.send(err)
        } else {
            res.redirect('/')
        }
    })
}
