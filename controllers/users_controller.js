const { validationResult } = require('express-validator')
const bcrypt = require('bcrypt')
const auth_controller = require('./auth_controller')
const usersCollection = require('../models/usersModel')
const otpCollection = require('../models/otpModel')
const categoryCollection = require('../models/categoryModel')
const brandCollection = require('../models/brandModel')
const productCollection = require('../models/productModel')
const cartCollection = require('../models/cartModel')
const mongoose = require('mongoose')
const { render } = require('ejs')
const { set } = require('../config/email')




exports.home = async (req,res)=>{
    const email = req.session.user
    if(email){
    const status = await usersCollection.findOne({email:email})
        if(status && status.isBlock){
           return res.redirect('/signup')  
        }
    } 
    res.render("User/index",{user:req.session.user,page:'home'})
    console.log(req.session.user)
    console.log(req.session)
    
}

// user login start 

exports.login = (req,res)=>{
    if(!req.session.user){
    res.render('User/signin')
    }else{
        res.redirect('/')
    }
}
exports.postlogin = async (req,res)=>{
   
    const {email,password} = req.body
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        const validationErrors = errors.array().reduce((acc, error) => {
            acc[error.path] = error.msg;
            return acc;
        }, {})
        console.log('validation error lilst:',validationErrors)
        return res.json({validationError:true, validationErrors})
    }else{
        userCheck = await usersCollection.findOne({email:email , isBlock:false})
        if(userCheck){
           const passCheck = await bcrypt.compare(password,userCheck.password)
           if(passCheck){
            req.session.user = userCheck._id  
            console.log('sucess')
            return res.json({success: true})
            
           }else{
            console.log('wrong password')
            return res.json({error:'wrong password'})
           
           }
        }else{
            console.log('invalid user')
           return res.json({error:'invalid user'})
           
        }
    }   

    }
   
//user login end



//user signup start 

exports.signup = (req,res)=>{
    res.render('User/signup') 
}

exports.postsignup = async (req,res)=>{
    const data = {
        username:req.body.username,
        email:req.body.email,
        phone:req.body.phone,
        password:req.body.password,
        cfpassword:req.body.cfpassword //This is for checking the password not store into database 
    }
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        console.log('iam here')
        const validationErrors = errors.array().reduce((acc,error)=>{
            console.log('path:',error.path)
            console.log('message:',error.msg)
            acc[error.path]=error.msg
            return acc
        },{})
        console.log(validationErrors)
        return res.json({validationError:true,validationErrors})
    }else{
    const user_check = await usersCollection.findOne({email:data.email})
    if(user_check){  
        return res.json({emailError:'user is already existed'})
    }else if(data.password != data.cfpassword){
        return res.json({passError:'please enter correct password'})
    }else{
        req.session.tempUser = {
            username: data.username,
            email: data.email,
            phone: data.phone,
            password: data.password
        };
        return res.json({success:true})
    }
}
}

//otp verification start 

exports.getsignupVerification = async (req,res)=>{
    const userData = req.session.tempUser
    if(!userData){
        console.log('iam going to signup page')
        return res.redirect('/signup')
        
    }
    const otp = auth_controller.generateOtp()
    console.log(otp) 
    
    await auth_controller.sendOtp(userData.email,otp)
    const otpExpiryTime = 30 * 1000
    res.render('User/otpVerify',{
        email:userData.email,
        timerDuration:Math.ceil(otpExpiryTime/ 1000)
    })
}

exports.signupVerification = async (req,res)=>{
    const {email , otp} = req.body
    const otpCheck = await otpCollection.findOne({email,otp})
    if(otpCheck && new Date() < otpCheck.expiresAt){
        const userData = req.session.tempUser
        if(!userData){
           console.log('missing session data')
           res.render('User/otpVerify',{
            error:'session expired please try again',
            email:email
           

           })
        }
        const hashedPassword = await bcrypt.hash(userData.password,10)
        userData.password = hashedPassword
        
       const newUser = await usersCollection.create(userData)
       console.log(newUser._id)
       req.session.user = newUser._id
       res.redirect('/')
    }else{
        const reminingTime = otpCheck ? Math.ceil((otpCheck.expiresAt - new Date())/1000):0;
        res.render('User/otpVerify',{
            error:'invalid otp',
            email:email,
            timerDuration:reminingTime > 0 ? reminingTime : 0
            
        })
    }
}

exports.resendOtp = async (req, res) => {
    const userData = req.session.tempUser
    const otp = auth_controller.generateOtp();
    console.log(otp)
    await auth_controller.sendOtp(userData.email, otp); // Send a new OTP

    const otpExpiryTime = 30 * 1000
    res.render('User/otpVerify', {
        email: userData.email,
        timerDuration:Math.ceil(otpExpiryTime/1000), // Reset timer to 1 minutes
        error: 'A new OTP has been sent to your email.'
    });
};

//otp verification end

//user signup end

//shope page start
exports.getShop = async(req,res)=>{
    try {
        const categories = await categoryCollection.find({deleted:false})
        const brands = await brandCollection.find({deleted:false})
        const products = await productCollection.find({deleted:false})
        const userId = req.session.user
        let productsInCart = {}
        for(let product of products){
           let productId = product._id
           const cart = await cartCollection.findOne({userId,'items.product':productId})

           productsInCart[productId] = cart ? true : false
        }
        
        res.render('User/shop',{
            user:req.session.user,
            page:'shop',
            categories,
            brands,
            products,
            productsInCart
        })

    } catch (error) {
        console.log('error',error)
    }
}

//shope page end

//view product page start 
exports.getViewProduct = async(req,res)=>{
    console.log(req.params);
    
    let productId = req.params.id
    try { 
    const userId = req.session.user    
    const product = await productCollection.findOne({_id:productId})
    const cart = await cartCollection.findOne({userId,'items.product':productId})
    const productInCart = cart? true : false
    const uniqueColors = [...new Set(product.variants.map(variant => variant.color))]
    return res.render('User/viewProduct',{ 
        user:req.session.user,   
        page:'shope',  
        product,
        uniqueColors,
        productInCart
    })
    } catch (error) {
        console.log('error',error)
    }
    
}
//view product end

//cart start

exports.getCart = async(req,res)=>{
    try {
        userId = req.session.user
        const cart = await cartCollection.findOne({userId:userId}).populate('items.product')
        
        res.render('User/cart',{
        user:req.session.user,
        page:null,
        cart
    })
    } catch (error) {
        console.log('cart kittunilla',error)
    }
   
}

exports.addToCart = async(req,res)=>{
    try {
       const  userId = req.session.user
       const  product = req.params.id
       const  quantity = req.body.quantity || 1
 

        const cart = await cartCollection.findOne({userId})
        if(cart){
            //user already have cart
            let productCheck = cart.items.find(item => item.product.toString() == product)
            if(productCheck){
                //product exsists in the cart
                return res.json({productExist:true,message:'GO TO CART'})
            }else{
                //product does not exist in the cart
                // itemTotal = cart.items.product.variants[0].price * quantity
                // console.log('itemTotal',itemTotal)
                cart.items.push({product, quantity})
                await cart.save()
                return res.json({success:true,message:'Added to cart'})
            }

        }else{
            //if user dont have cart, so create new cart
            const newCart = await cartCollection.create({
                userId,
                items:[{product, quantity}]
            })
             
            console.log('userid',userId)
            // console.log(items.product,items.quantity)
            return res.json({success:true,message:'Added to cart'})
        }
    } catch (error) {
        console.error('server error',error)
        return res.status(500).json({success:false,message:'sever error'})
    }
}

exports.deleteCartItem = async(req,res)=>{
    try {
        const userId = req.session.user
        const itemsId = req.params.id
        await cartCollection.updateOne(
            {userId:userId},
            {$pull:{items:{_id:itemsId}}}
        )

        return res.json({success:true})
    } catch (error) {
        console.log('something went wrong',error)
    }
}

exports.updatedCartQuantity = async(req,res)=>{
    try {
        const {itemId, quantity} = req.body
        const cartItemId = new mongoose.Types.ObjectId(itemId)
        await cartCollection.updateOne(
            {'items._id':cartItemId},
            {$set:{'items.$.quantity':quantity}}
        )

       return res.json({success:true})
    } catch (error) {
        console.error('Error updating quantity:', error.message); // Log the error message
        console.error('Error stack:', error.stack);
    }
}

//cart end

exports.userLogout = async (req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            res.send(err)
        }else{
            res.redirect('/')
        }
    })
}

// const hashed_password = await bcrypt.hash(data.password,10)
        //remove the confirmation password before storing into database
        // delete data.cfpassword
        // data.password = hashed_password
        // await usesrsCollection.insertMany(data)
        // req.session.user_created = true
        // req.session.user_Exist = null
        // req.session.pass_match = null
        // res.redirect('/')