const express = require('express') 
const passport = require('passport')
const users_controller = require('../controllers/users_controller')
const wishlist_controller = require('../controllers/wishlist_controller')
const coupon_controller = require('../controllers/coupon_controller')
const wallet_controller = require('../controllers/wallet_controller')
const userAuth = require('../middleware/userAuth')
const validater = require('../middleware/formValidation')
const addressValidation = require('../middleware/addressValidation')
const editProfileValidation = require('../middleware/editProfileValidation')
const router = express.Router()

router.get('/',users_controller.home)
router.get('/login',users_controller.login)
router.post('/login',validater.formValidation,users_controller.postlogin)
// router.post('/login/verifyOtp',users_controller.loginVerification)
router.get('/signup',users_controller.signup)
router.post('/signup',validater.signupValidation,users_controller.postsignup)
router.get('/signup/verifyOtp',users_controller.getsignupVerification)
router.post('/signup/verifyOtp',users_controller.signupVerification)
router.post('/resendOtp',users_controller.resendOtp)
router.get('/auth/google',passport.authenticate('google',{
    scope:['profile','email'],
    prompt:'select_account'
}))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/login'}),
    (req,res)=>{
        if(req.user.isBlock){
            res.redirect('/login')
        }else{ 
            req.session.user = req.user._id                  
            res.redirect('/')
        }
   
})

//forgot password start
router.get('/forgotPassword/emailVerification',users_controller.emailVerification)
router.post('/forgotPassword/emailVerify',users_controller.postEmailVerification) 
router.get('/forgotPassword/otpVerify',users_controller.getOtpVerificationFrg)
router.post('/forgotPassword/postOtpVerify',users_controller.postOtpVerifyFrg)
router.post('/forgotPassword/resendOtp',users_controller.resendOtpFrg)
router.get('/changePassword',users_controller.changePassword)
router.post('/changePassword',users_controller.PostchangePassword)


router.get('/shop',users_controller.getShop)
router.get('/viewProduct/:id',users_controller.getViewProduct)    

//cart start
router.get('/cart',userAuth,users_controller.getCart)
router.post('/addToCart/:id',userAuth,users_controller.addToCart)
router.put('/updatedCartItemQuantity',userAuth,users_controller.updatedCartQuantity)
router.delete('/deleteCartItem/:id',userAuth,users_controller.deleteCartItem)
//cart end

//coupon start
router.post('/checkOut/applyCoupon',userAuth,coupon_controller.applyCoupon)
router.post('/checkout/removeCoupon',userAuth,coupon_controller.userRemoveCoupon)
//coupon end

//wishlist start
router.get('/wishlist',userAuth,wishlist_controller.getWishlist)
router.post('/addWishlist/:id',userAuth,wishlist_controller.postWishlist)
router.put('/removeWishlist/:id',userAuth,wishlist_controller.removeWishlist)
//wishlist end

//checkout start
router.get('/cart/checkOut',userAuth,users_controller.getCheckOut)
router.post('/cart/checkOut/placeOrder',userAuth,users_controller.placeOrder)
router.post('/verifyPayment',userAuth,users_controller.verifyPayment)
//checkout end

//profile
router.get('/myProfile',userAuth,users_controller.getProfile)
router.put('/myProfile/editProfile',userAuth,editProfileValidation,users_controller.editProfile)
router.post('/change-password',userAuth,users_controller.setNewPassword)

router.get('/myProfile/addAddress',userAuth,users_controller.addAddress)
router.post('/myProfile/addAddress',userAuth,addressValidation,users_controller.postAddress)
router.get('/myProfile/editAddres/:id',userAuth,users_controller.getEditAddress)
router.put('/myProfile/editAddress/:id',userAuth,addressValidation,users_controller.editAddressPost)
router.delete('/myProfile/deleteAddress/:id',userAuth,users_controller.deleteAddress)

router.get('/myProfile/wallet',userAuth,wallet_controller.getWallet)

router.get('/orderDetail/:id',userAuth,users_controller.orderDetail)
router.get('/downloadInvoice',userAuth,users_controller.downloadInvoice)
router.put('/payAfter',userAuth,users_controller.payAfter)
router.put('/submitReview',userAuth,users_controller.submitReview)

router.post('/cancelProductUser',userAuth,users_controller.cancelProduct)
router.put('/returnProduct',userAuth,users_controller.returnProduct)




 
router.get('/logout',users_controller.userLogout)


module.exports = router