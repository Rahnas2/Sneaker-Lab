const express = require('express') 
const passport = require('passport')
const users_controller = require('../controllers/users_controller')
const validater = require('../middleware/formValidation')
const userAuth = require('../middleware/userAuth')
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



router.get('/shop',users_controller.getShop)
router.get('/viewProduct/:id',users_controller.getViewProduct)    

//cart start
router.get('/cart',userAuth,users_controller.getCart)
router.post('/addToCart/:id',userAuth,users_controller.addToCart)
router.put('/updatedCartItemQuantity',userAuth,users_controller.updatedCartQuantity)
router.delete('/deleteCartItem/:id',userAuth,users_controller.deleteCartItem)

 
router.get('/logout',users_controller.userLogout)


module.exports = router