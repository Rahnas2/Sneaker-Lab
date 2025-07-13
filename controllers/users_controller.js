const { validationResult } = require('express-validator')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const usersCollection = require('../models/usersModel')
const otpCollection = require('../models/otpModel')
const productCollection = require('../models/productModel')
const variantCollection = require('../models/variantModel')
const cartCollection = require('../models/cartModel')
const addressCollection = require('../models/addressModel')
const orderCollection = require('../models/orderModel')
const couponCollection = require('../models/couponModel')
const walletCollection = require('../models/walletModel')
const invoiceService = require('../services/invoiceDownload')
const Razorpay = require('razorpay')
const HttpStatusCode = require('../utils/statsCode')
const variantModel = require('../models/variantModel')
const { generateOtp } = require('../utils/generateOtp')
const { sendOtp } = require('../utils/sendOtp')
const { generateReferralCode } = require('../utils/generateReferalCode')

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})


exports.home = async (req, res, next) => {
    try {
        //user id
        const userId = req.session.user

        if (userId) {
            const status = await usersCollection.findById(userId)
            if (status && status.isBlock) {
                return res.redirect('/login')
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
        const newArrivals = await productCollection.find({ deleted: false }).populate('variants')
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
        next(error)
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
exports.postlogin = async (req, res, next) => {
    try {
        const { email, password } = req.body

        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            const validationErrors = errors.array().reduce((acc, error) => {
                acc[error.path] = error.msg;
                return acc;
            }, {})
            return res.status(HttpStatusCode.BAD_REQUEST).json({ validationError: true, validationErrors })
        }
        userCheck = await usersCollection.findOne({ email: email })
        if (!userCheck) {
            return res.status(HttpStatusCode.BAD_REQUEST).json({ error: 'invalid user' });
        }

        if (userCheck.isBlock) {
            return res.status(HttpStatusCode.FORBIDDEN).json({ error: 'you are blocked by admin' })
        }

        if (userCheck.googleId) {
            return res.status(HttpStatusCode.FORBIDDEN).json({ error: 'You signed up using Google. Please use Google Sign-In to access your account.' })
        }
        if (userCheck) {
            const passCheck = await bcrypt.compare(password, userCheck.password)
            if (passCheck) {
                req.session.user = userCheck._id
                return res.json({ success: true })

            } else {
                return res.status(HttpStatusCode.BAD_REQUEST).json({ error: 'wrong password' })

            }
        }
    } catch (error) {
        next(error)
    }

}

//=========login end=========// 


//=========signup start=========// 

exports.signup = (req, res) => {
    res.render('User/signup')
}

exports.postsignup = async (req, res, next) => {
    try {
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
            return res.status(HttpStatusCode.BAD_REQUEST).json({ validationError: true, validationErrors })
        } else {
            const user_check = await usersCollection.findOne({ email: data.email })
            if (user_check) {
                return res.status(HttpStatusCode.CONFLICT).json({ emailError: 'user is already existed' })
            } else if (data.password != data.cfpassword) {
                return res.status(HttpStatusCode.BAD_REQUEST).json({ passError: 'please enter correct password' })
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
    } catch (error) {
        next(error)
    }

}

//=========otp verification start=========// 

exports.getsignupVerification = async (req, res, next) => {
    try {
        const userData = req.session.tempUser
        if (!userData) {
            return res.redirect('/signup')

        }
        const otp = generateOtp()
        console.log(otp)

        await sendOtp(userData.email, otp)

        const otpExpiryTime = 30 * 1000
        res.render('User/otpVerify', {
            email: userData.email,
            timerDuration: Math.ceil(otpExpiryTime / 1000)
        })
    } catch (error) {
        next(error)
    }

}

exports.signupVerification = async (req, res, next) => {
    try {
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

            const code = generateReferralCode()

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
    } catch (error) {
        next(error)
    }

}

exports.resendOtp = async (req, res, next) => {
    try {
        const userData = req.session.tempUser
        const otp = generateOtp()

        await sendOtp(userData.email, otp) // Send Otp

        const otpExpiryTime = 30 * 1000
        res.render('User/otpVerify', {
            email: userData.email,
            timerDuration: Math.ceil(otpExpiryTime / 1000), // Reset timer to 1 minutes
            error: 'A new OTP has been sent to your email.'
        });
    } catch (error) {
        next(error)
    }

};

//=========otp verification end=========// 

//=========user signup end=========// 


//=========forgotPasword end=========// 

exports.emailVerification = (req, res, next) => {
    try {
        res.render('User/emailVerification')
    } catch (error) {
        next(error)
    }
}

exports.postEmailVerification = async (req, res, next) => {
    try {
        const { email } = req.body

        const user = await usersCollection.findOne({ email: email })
        if (user) {
            if (user.googleId) {
                return res.status(HttpStatusCode.FORBIDDEN).json({ googleUser: true, message: 'You signed up using Google. Please use Google Sign-In to access your account.' })
            }

            const otp = generateOtp()

            await sendOtp(email, otp)
            const otpExpiryTime = 30 * 1000

            req.session.emailAuth = email

            return res.json({ success: true })
        }
        return res.json({ inValidEmail: true, message: 'invalid email' })

    } catch (error) {
        next(error)
    }
}


exports.getOtpVerificationFrg = (req, res, next) => {
    try {
        res.render('User/otpVerifyFrg')
    } catch (error) {
        next(error)
    }
}

exports.postOtpVerifyFrg = async (req, res, next) => {
    try {
        const email = req.session.emailAuth
        const { otp } = req.body
        if (!email) {
            return res.status(HttpStatusCode.NOT_FOUND).json({ error: true, message: 'email not found' })
        }

        const otpCheck = await otpCollection.findOne({ email, otp })
        if (otpCheck && new Date() < otpCheck.expiresAt) {
            return res.json({ success: true })
        }

        return res.status(HttpStatusCode.BAD_REQUEST).json({ error: true, message: 'invalid otp' })
    } catch (error) {
        next(error)
    }
}

exports.resendOtpFrg = async (req, res, next) => {
    try {
        const email = req.session.emailAuth;
        if (!email) {
            return res.status(HttpStatusCode.NOT_FOUND).json({ error: true, message: 'Email not found' });
        }
        const otp = generateOtp()

        await sendOtp(email, otp)

        res.json({ success: true, message: 'A new OTP has been sent to your email' });
    } catch (error) {
        next(error)
    }
};


exports.changePassword = (req, res, next) => {
    try {
        res.render('User/changePassword')
    } catch (error) {
        next(error)
    }
}

exports.PostchangePassword = async (req, res, next) => {
    try {
        const { newPassword, confirmPassword } = req.body
        console.log('change password body ', req.body)
        const email = req.session.emailAuth
        const user = await usersCollection.findOne({ email: email })
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        await user.save()
        return res.json({ success: true })
    } catch (error) {
        next(error)
    }
}
//=========forgot Pasword end=========// 

//=========profile start=========// 
exports.getProfile = async (req, res, next) => {
    try {
        const userId = req.session.user;
        const { section = 'profile', page = 1, limit = 5 } = req.query;

        const user = await usersCollection.findById(userId);
        const address = await addressCollection.findOne({ userId: userId });

        let orders = [];
        let ordersPagination = null;
        let wallet = null;
        let walletPagination = null;

        // Handle Orders Pagination
        if (section === 'orders' || section === 'profile') {
            const ordersCount = await orderCollection.countDocuments({ userId: user });
            const ordersLimit = parseInt(limit);
            const ordersPage = parseInt(page);
            const ordersSkip = (ordersPage - 1) * ordersLimit;

            orders = await orderCollection
                .find({ userId: user })
                .sort({ createdAt: -1 })
                .skip(ordersSkip)
                .limit(ordersLimit);

            ordersPagination = {
                currentPage: ordersPage,
                limit: ordersLimit,
                totalPages: Math.ceil(ordersCount / ordersLimit),
            };
        }

        // Handle Wallet Pagination
        const walletDoc = await walletCollection.findOne({ userId: userId });
        if (walletDoc) {
            wallet = { balance: walletDoc.balance };

            if (section === 'wallet' || section === 'profile') {
                const historyCount = walletDoc.history.length;
                const walletLimit = parseInt(limit);
                const walletPage = parseInt(page);
                const walletSkip = (walletPage - 1) * walletLimit;

                // Sort history by date (newest first) and paginate
                const sortedHistory = walletDoc.history
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(walletSkip, walletSkip + walletLimit);

                wallet.history = sortedHistory;


                walletPagination = {
                    currentPage: walletPage,
                    limit: walletLimit,
                    totalPages: Math.ceil(historyCount / walletLimit)
                };
            }
        }

        return res.render('User/profile', {
            user,
            address,
            orders,
            wallet,
            ordersPagination,
            walletPagination,
            currentSection: section,
            currentPage: parseInt(page),
            page: null
        });

    } catch (error) {
        next(error)
    }
};

// Separate API endpoints for AJAX pagination
exports.getOrdersPaginated = async (req, res, next) => {
    try {
        const userId = req.session.user;
        const { page = 1, limit = 5 } = req.query;

        const ordersCount = await orderCollection.countDocuments({ userId: userId });
        const ordersLimit = parseInt(limit);
        const ordersPage = parseInt(page);
        const ordersSkip = (ordersPage - 1) * ordersLimit;

        const orders = await orderCollection
            .find({ userId: userId })
            .sort({ createdAt: -1 })
            .skip(ordersSkip)
            .limit(ordersLimit);

        const pagination = {
            currentPage: ordersPage,
            limit,
            totalPages: Math.ceil(ordersCount / ordersLimit),
        };

        res.json({
            success: true,
            orders,
            pagination
        });

    } catch (error) {
        next(error)
    }
};



exports.editProfile = async (req, res, next) => {
    try {
        //validation
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            const validationErrors = errors.array().reduce((acc, error) => {
                acc[error.path] = error.msg;
                return acc;
            }, {})
            return res.status(HttpStatusCode.BAD_REQUEST).json({ validationError: true, validationErrors })
        }

        const userId = req.session.user
        const { username, phone } = req.body
        const user = await usersCollection.findById(userId)

        if (user.username === username && (user.phone ? user.phone.toString() === phone : !phone)) {
            return res.status(HttpStatusCode.BAD_REQUEST).json({ noChange: true, message: 'sorry you didit make any changes' })
        }

        if (user.username !== username) {
            await usersCollection.updateOne(
                { _id: userId },
                { $set: { username: username } }
            )
        }

        if (phone && phone.length === 10 && user.phone?.toString() !== phone) {
            await usersCollection.updateOne(
                { _id: userId },
                { $set: { phone: Number(phone) } }
            )
        }

        return res.json({ success: true, message: 'successfully updated your profile' })
    } catch (error) {
        next(error)
    }
}


exports.setNewPassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (newPassword.trim().length < 8) {
            return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, error: 'newPassword', message: 'password should be atleast length 8' })
        }
        const userId = req.session.user
        const user = await usersCollection.findById({ _id: userId });

        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.json({ success: false, error: 'currentPassword', message: 'Current password is incorrect' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        next(error)
    }
}

exports.addAddress = async (req, res, next) => {
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
        next(error)
    }
}

exports.postAddress = async (req, res, next) => {
    try {
        const source = req.session.source
        //validation 
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            const validationErrors = errors.array().reduce((acc, error) => {
                acc[error.path] = error.msg
                return acc
            }, {})
            return res.status(HttpStatusCode.BAD_REQUEST).json({ validationError: true, validationErrors })
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
            return res.status(HttpStatusCode.FORBIDDEN).json({ success: false, message: 'sorry you cannot add more than three address!', source })
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
        next(error)
    }
}


exports.getEditAddress = async (req, res, next) => {
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
        next(error)
    }
}

exports.editAddressPost = async (req, res, next) => {
    try {
        const source = req.session.source
        //validation errror
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            const validationErrors = errors.array().reduce((acc, error) => {
                acc[error.path] = error.msg
                return acc
            }, {})
            return res.status(HttpStatusCode.BAD_REQUEST).json({ validationError: true, validationErrors })
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
            return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: 'address not found', source })
        } else {
            return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: 'user document not found', source })
        }
    } catch (error) {
        next(error)
    }
}

exports.deleteAddress = async (req, res, next) => {
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

            return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: 'address not found' })
        }
        return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: 'address document not found' })
    } catch (error) {
        next(error)
    }
}

exports.orderDetail = async (req, res, next) => {
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
        next(error)
    }
}

exports.downloadInvoice = (req, res, next) => {
    try {
        const { orderId } = req.query
        invoiceService.invoiceDownload(res, orderId)
    } catch (error) {
        next(error)
    }
}

exports.cancelProduct = async (req, res, next) => {
    try {
        const { orderId, itemId } = req.body

        const orders = await orderCollection.findOne({ _id: orderId })

        if (!orders) {
            return res.status(HttpStatusCode.NOT_FOUND).json({ success: false, message: 'Order not found' });
        }

        const itemIndex = orders.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.status(HttpStatusCode.NOT_FOUND).json({ success: false, message: 'Item not found in order' });
        }


        const { variantId, quantity, size } = orders.items[itemIndex];

        //Update Size Quantity
        await variantCollection.updateOne(
            { _id: variantId, 'sizes.size': size },
            { $inc: { 'sizes.$.stock': quantity } }
        );

        const { status, paymentStatus } = orders.items[itemIndex]


        if (status === 'order placed' || status === 'pending') {

            await orderCollection.findOneAndUpdate(
                { _id: orderId, 'items._id': itemId },
                { $set: { 'items.$.status': 'canceled' } },
                { new: true }
            )
        } else {
            return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: 'sorry, please make sure your product is not delivered or canceled' })
        }

        // handinling wallet refunds for online or wallet payment methods
        if ((orders.paymentMethod === 'RAZORPAY' || orders.paymentMethod === 'WALLET') && paymentStatus === 'paid') {
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
        next(error)
    }
}

exports.returnProduct = async (req, res, next) => {
    try {
        const { orderId, itemId, returnReason } = req.body

        const orders = await orderCollection.findOne({ _id: orderId })

        if (!orders) {
            return res.status(HttpStatusCode.NOT_FOUND).json({ success: false, message: 'Order not found' });
        }

        const itemIndex = orders.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.status(HttpStatusCode.NOT_FOUND).json({ success: false, message: 'Item not found in order' });
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
        next(error)
    }
}

//=========profile end=========// 

exports.getCheckOut = async (req, res, next) => {
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
                const coupon = await couponCollection.findOne({ code: appliedCouponCode, usedBy: { $ne: userId } });
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
                } else {
                    delete req.session.coupon
                }
            }

            await cart.save();
        } else {
            res.redirect('/')
            return
        }

        const address = await addressCollection.findOne({ userId: user })

        const coupons = await couponCollection.find({ isActive: true, usedBy: { $ne: userId } })

        const appliedCoupon = req.session.coupon ? await couponCollection.findOne({ code: req.session.coupon.code, usedBy: { $ne: userId } }) : false;

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
        next(error)
    }
}

exports.placeOrder = async (req, res, next) => {
    try {
        const userId = req.session.user
        const { deliveryAddress, paymentMethod } = req.body

        const existingOrder = await orderCollection.findOne({ userId, orderLockStatus: 'in-progress' })
        if (existingOrder) {
            return res.status(HttpStatusCode.BAD_REQUEST).json({ error: true, message: "You're already placing an order. Please complete the payment or wait." });
        }

        //address
        const address = await addressCollection.findOne({ userId })
        if (!address) {
            return res.status(HttpStatusCode.NOT_FOUND).json({ error: true, message: 'sorry address not found' })
        }

        const userAddress = address.addresses.find(addr => addr._id.toString() === deliveryAddress)
        if (!userAddress) {
            return res.status(HttpStatusCode.NOT_FOUND).json({ error: true, message: 'sorry address not found' })
        }

        //payment method
        if (!paymentMethod) {
            return res.status(HttpStatusCode.NOT_FOUND).json({ error: true, message: 'plese select a payment option' })
        }

        //cart
        const cart = await cartCollection.findOne({ userId: userId }).populate([
            { path: 'items.product' },
            { path: 'items.variant' },

        ])

        if (!cart || cart.items.length === 0) {
            return res.json({ error: true, message: 'your cart is empty' })
        } else {
            cart.items.forEach(item => {
                // Check if the product has a valid offer
                const product = item.product;
                const variant = item.variant

                if (product.offer && product.offer.expirAt && new Date(product.offer.expirAt) >= new Date()) {
                    // Calculate the offer price
                    const originalPrice = variant.price
                    const discount = product.offer.discountPercentage;

                    const offerPrice = Math.round(originalPrice - (originalPrice * discount / 100))
                    item.offerPrice = offerPrice
                    item.itemTotal = Math.round(originalPrice - (originalPrice * discount / 100)) * item.quantity;
                } else {
                    // No offer, use the original price
                    item.itemTotal = variant.price * item.quantity;
                }
            });

            //if a couon applied
            const appliedCouponCode = req.session.coupon ? req.session.coupon.code : false;
            if (appliedCouponCode) {
                const coupon = await couponCollection.findOne({ code: appliedCouponCode, usedBy: { $ne: userId } });
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
                } else {
                    delete req.session.coupon
                }
            }

            await cart.save();
        }

        const orderItems = cart.items.map(item => ({
            productId: item.product._id,
            productName: item.product.productName,
            variantId: item.variant._id,
            size: item.size,
            image: item.variant.images[0],
            price: item.variant.price,
            offerPrice: item.offerPrice || item.variant.price,
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
            await couponCollection.findOneAndUpdate({ code: orderDetails.couponCode }, { $push: { usedBy: userId } })
            delete req.session.coupon
        }

        // if(paymentMethod === 'WALLET'){
        //     wallet = await walletCollection.findOne({userId:userId})
        //     if(wallet.balance < totalAmount){
        //         return res.json({error:true, message:'insufficient balance in your wallet, please try another option'})
        //     }

        // }
       
        const order = await orderCollection.create(orderDetails)
       

        if (paymentMethod === 'RAZORPAY') {
            
            await processOrderPostPayment(orderItems)

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
                orderId: order._id,
                razorpayOrderId: razorpayOrder.id,
                amount: totalAmount,
                razorpay: true,
                key: process.env.RAZORPAY_KEY_ID
            })
        }

        if (paymentMethod === 'COD') {
            //COD Not allowed for above 1000
            if (orderDetails.totalAmount > 1000) {
                const deleteOrder = await orderCollection.findByIdAndDelete(order._id)
                console.log('delte order ', deleteOrder)
                return res.json({ error: true, message: 'sorry cash on delivery is not allowed for above 1000,plese go with another methods' })
            }
            
            await orderCollection.findByIdAndUpdate(order._id, { orderLockStatus: 'completed' })
            await processOrderPostPayment(orderItems)

            await cartCollection.findOneAndUpdate({ userId: order.userId }, { $set: { items: [] } });

            return res.json({ success: true, message: 'order placed successfully' })
        }
    } catch (error) {
        next(error)
    }
}

//function to handle order post logic
async function processOrderPostPayment(orderItems) {

    //update the stock
    for (const item of orderItems) {
        await variantCollection.updateOne(
            { _id: item.variantId, "sizes.size": item.size },
            { $inc: { "sizes.$.stock": -item.quantity } }
        );
    }
}


// Close Razorpay Payment Modal 
exports.closePayment = async (req, res, next) => {
    try {
        const { orderId } = req.body;

        console.log('duty started maan ', orderId)

        const order = await orderCollection.findOne({ _id: orderId, orderLockStatus: 'in-progress' });
        if (!order) {
            return res.status(HttpStatusCode.BAD_REQUEST).json({ error: true, message: 'Order not found' });
        }

        // Loop over items to restore stock
        for (const item of order.items) {
            await variantCollection.updateOne(
                {
                    _id: item.variantId,
                    'sizes.size': item.size
                },
                {
                    $inc: {
                        'sizes.$.stock': item.quantity
                    }
                }
            );
        }

        // Delete the order
        await orderCollection.findByIdAndDelete(orderId);
    } catch (error) {
        next(error)
    }
}

exports.verifyPayment = async (req, res, next) => {
    try {
        const { paymentId, razorpayOrderId, orderId, signature, failed, isRetry } = req.body
        const userId = req.session.user

        let paymentStatus = 'faild'
        let status = 'pending'
        let paymentSuccess = false

        if (!failed) {
            const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(razorpayOrderId + '|' + paymentId)
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
                { _id: orderId },
                {
                    $set: {
                        'items.$[].paymentStatus': paymentStatus,
                        'items.$[].status': status
                    }
                }
            )

            if (paymentSuccess) {
                return res.json({ success: true, message: 'payment successfull' })
            } else {
                return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: 'payment faild' })
            }

        }

        await orderCollection.updateOne(
            { _id: orderId },
            {
                $set: {
                    'items.$[].status': status,
                    'items.$[].paymentStatus': paymentStatus,
                    orderLockStatus: 'completed'
                }
            }
        )

        // Cear User Cart 
        await cartCollection.findOneAndUpdate({ userId }, { $set: { items: [] } });

        if (paymentSuccess) {

            return res.json({ success: true, message: 'order placed successfully', orderId })
        } else {
            return res.json({ success: true, messagae: 'payment faild , order created with pending status', orderId })
        }


    } catch (error) {
        console.error('someting went wrong', error)
    }
}

exports.payAfter = async (req, res, next) => {
    try {
        const { orderId, paymentMethod } = req.body
        const userId = req.session.user


        //order 
        const order = await orderCollection.findOne({ _id: orderId })


        //payment method
        if (!paymentMethod) {
            return res.status(HttpStatusCode.NOT_FOUND).json({ success: false, message: 'plese select a payment method' })
        }

        // Wallet Payment 
        if (paymentMethod === 'wallet') {
            const wallet = await walletCollection.findOne({ userId: userId })
            if (!wallet) {
                return res.status(HttpStatusCode.NOT_FOUND).json({ success: false, message: 'sorry wallet not found' })
            }


            //wallet balance checking
            if (order.totalAmount > wallet.balance) {
                return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: 'Insufficient balance in wallet' })
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


        // Razorpay
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
            orderId,
            amount: order.totalAmount,
            razorpay: true,
            key: process.env.RAZORPAY_KEY_ID
        })


    } catch (error) {
        next(error)
    }
}

exports.submitReview = async (req, res, next) => {
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
        return res.json({ success: true, message: 'Thanks for your feedback', item })

    } catch (error) {
        next(error)
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
