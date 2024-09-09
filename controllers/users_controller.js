const { validationResult } = require('express-validator')
const bcrypt = require('bcrypt')
const auth_controller = require('./auth_controller')
const usersCollection = require('../models/usersModel')
const otpCollection = require('../models/otpModel')
const categoryCollection = require('../models/categoryModel')
const brandCollection = require('../models/brandModel')
const productCollection = require('../models/productModel')
const variantCollection = require('../models/variantModel')
const cartCollection = require('../models/cartModel')
const addressCollection =require('../models/addressModel')
const orderCollection = require('../models/orderModel')
const mongoose = require('mongoose')
const { render } = require('ejs')
const { set } = require('../config/email')
const { json } = require('body-parser')




exports.home = async (req,res)=>{
    try {
    const userId = req.session.user
    if(userId){
    const status = await usersCollection.findById(userId)
        if(status && status.isBlock){
           return res.redirect('/signup')  
        }
    } 
    return res.render("User/index",{user:req.session.user,page:'home'}) 
    } catch (error) {
        console.error('something went wrong',error)
    } 
}

//=========login start=========// 

exports.login = async(req,res)=>{ 
    const userId = req.session.user
    const status = await usersCollection.findById(userId)
    if(!status || status.isBlock){
    return res.render('User/signin')
    }
    else{
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
        return res.json({validationError:true, validationErrors})
    }
        userCheck = await usersCollection.findOne({email:email , isBlock:false})
        if (!userCheck) {
            console.log('invalid user');
            return res.json({ error: 'invalid user' });
        }

        if(userCheck.googleId){
            return res.json({error:'You signed up using Google. Please use Google Sign-In to access your account.'})
        }
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
        } 
        }
     

    
   
//=========login end=========// 



//=========signup start=========// 

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

//=========otp verification start=========// 

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
    try {
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
    } catch (error) {
        console.error('someting went wrong',error)
    }
    
};

//=========otp verification end=========// 

//=========user signup end=========// 


//=========forgotPasword end=========// 

exports.emailVerification = (req,res) =>{
        try {
           res.render('User/emailVerification') 
        } catch (error) {
           conosle.error('something went wrong') 
        }
}

exports.postEmailVerification = async (req,res) =>{
    try {
        const {email} = req.body
        console.log('emal',email)
        const user = await usersCollection.findOne({email:email})
        if(user){
            if(user.googleId){
                return res.json({googleUser:true,message:'You signed up using Google. Please use Google Sign-In to access your account.'})
            }
            
            const otp = auth_controller.generateOtp()
            console.log(otp) 
            
            await auth_controller.sendOtp(email,otp)
            const otpExpiryTime = 30 * 1000

            req.session.emailAuth = email
            
            return res.json({success:true})
        }
        return res.json({inValidEmail:true,message:'invalid email'})

    } catch (error) {
        console.error('something went wrong',error)
    }
}


exports.getOtpVerificationFrg = (req,res)=>{
    try {
         res.render('User/otpVerifyFrg')
    } catch (error) {
        console.error('something went wrong',error)
    }
}

exports.postOtpVerifyFrg = async (req,res)=>{
    try {
        const email = req.session.emailAuth
        const {otp} = req.body
        if(!email){
            return res.json({error:true, message:'email not found'})
        }

        const otpCheck = await otpCollection.findOne({email,otp})
        if(otpCheck && new Date() < otpCheck.expiresAt){
            return res.json({success:true})
        }

        return res.json({error:true, message:'invalid otp'})


    } catch (error) {
        console.error('something went wrong',error)
    }
}

exports.resendOtpFrg = async (req, res) => {
    const email = req.session.emailAuth;
    if (!email) {
        return res.json({ error: true, message: 'Email not found' });
    }

    try {

           const otp = auth_controller.generateOtp()
            console.log(otp) 
            
            await auth_controller.sendOtp(email,otp)
            
        res.json({ success: true, message: 'A new OTP has been sent to your email' });
    } catch (error) {
        console.error('Error resending OTP', error);
        res.json({ error: true, message: 'Failed to resend OTP' });
    }
};


exports.changePassword = (req,res) =>{
    try {
       res.render('User/changePassword') 
    } catch (error) {
        console.error('something went wrong',error)
    }
}

exports.PostchangePassword = async (req,res) =>{
    try {
        const {newPassword, confirmPassword} = req.body
        const email = req.session.emailAuth
        const user = await usersCollection.findOne({email:email})
        const hashedPassword = await bcrypt.hash(newPassword,10)
        user.password = hashedPassword
        await user.save()
        return res.json({success:true})

    } catch (error) {
        console.error('something went wrong',error)
    }
}


//=========forgot Pasword end=========// 

//=========shope page start=========// 
exports.getShop = async(req,res)=>{
    try {
        const categories = await categoryCollection.find({deleted:false})
        const brands = await brandCollection.find({deleted:false})
        
        const userId = req.session.user

        const filter = req.query.filter

        const search = req.query.search || ''

        console.log('filter',filter)

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
            { $match: { deleted: false } },
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

        const products = await productCollection.aggregate(aggregationPipeline)


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
            productsInCart,
            filter,
            search
        })

    } catch (error) {
        console.log('error',error)
    }
}

//=========shope page end=========// 

//=========view product start=========// 
exports.getViewProduct = async(req,res)=>{
    try { 
    const productId = req.params.id    
    const userId = req.session.user    
    const product = await productCollection.findOne({_id:productId}).populate('variants')
    const cart = await cartCollection.findOne({userId:userId,'items.product':productId})
    const productInCart = cart? true : false
    console.log('product in cart',productInCart)
    res.render('User/viewProduct',{ 
        user:req.session.user,   
        page:'shope',  
        product,
        productInCart
    })
    } catch (error) {
        console.log('error',error)   
    }
    
}
//=========view product end=========// 

//=========cart start=========// 

exports.getCart = async(req,res)=>{
    try {
        userId = req.session.user
        const cart = await cartCollection.findOne({userId:userId}).populate({
            path:'items.product',
            populate:{
                path:'variants'
            }
        })
        
        res.render('User/cart',{
        user:req.session.user,
        page:null,
        cart
    })
    } catch (error) {
        console.log('something went wrong',error)
    }
   
}

exports.addToCart = async(req,res)=>{
    try {
       const  userId = req.session.user
       const  product = req.params.id
       const  quantity = req.body.quantity || 1
       const  itemTotal = req.body.itemTotal
 

        const cart = await cartCollection.findOne({userId:userId})
        if(cart){
            //user already have cart
            let productCheck = cart.items.find(item => item.product.toString() === product.toString())
            
            if(productCheck){
                //product exsists in the cart
                return res.json({productExist:true,message:'GO TO CART'})
            }else{
                cart.items.push({product, quantity, itemTotal})
                await cart.save()
                return res.json({success:true,message:'Added to cart'})
            }

        }else{
            //if user dont have cart, so create new cart
            await cartCollection.create({
                userId,
                items:[{product, quantity,itemTotal}]
            })
             
            return res.json({success:true,message:'Added to cart'})
        }
    } catch (error) {
        console.error('server error',error)
        return res.status(500).json({success:false,message:'sever error'})
    }
}

exports.deleteCartItem = async(req,res)=>{
    try {
        //user id
        const userId = req.session.user

        //item id
        const itemsId = req.params.id

        //find cart
        const cart = await cartCollection.findOne({userId:userId})

        // updated totalQuantity
        const updatedQuantity = cart.totalQuantity-1
        
        //update items and updated cart quantity
        await cartCollection.updateOne(
            {userId:userId},
            {
                $pull:{items:{_id:itemsId}},
                $set:{totalQuantity:updatedQuantity},
            }   
        )

        //update cart total
        const currentCart = await cartCollection.findOne({userId:userId})
        const updatedCartTotal = currentCart.items.reduce((acc,curr)=>{
            acc += curr.itemTotal
            return acc
        },0)

        await cartCollection.updateOne(
            {userId:userId},
            {
               $set:{totalPrice:updatedCartTotal}
            }   
        )

        return res.json({success:true,updatedCartTotal})
    } catch (error) {
        console.log('something went wrong',error)
    }
}

exports.updatedCartQuantity = async(req,res)=>{
    try {
        const userId = req.session.user

        const {itemId, quantity, itemTotal} = req.body
        
        //converting to object id
        const cartItemId = new mongoose.Types.ObjectId(itemId)
       
        //update quantity and item total
        await cartCollection.updateOne(
            {'items._id':cartItemId},
            {
                $set:{
                    'items.$.quantity':quantity,
                    'items.$.itemTotal':itemTotal
                }
            }
            
        )

        //update cart total
        const cart = await cartCollection.findOne({userId:userId})
        const updatedCartTotal = cart.items.reduce((acc,curr)=>{
            acc += curr.itemTotal
            return acc
        },0)

        await cartCollection.updateOne({userId:userId},
            {
                $set:{totalPrice:updatedCartTotal}
            })

       return res.json({success:true,updatedCartTotal})
    } catch (error) {
        console.error('Error updating quantity:', error.message); 
        console.error('Error stack:', error.stack);
    }
}

//=========cart end=========// 

//=========profile start=========// 

exports.getProfile = async (req,res)=>{
    try {    
        const userId = req.session.user
        const user = await usersCollection.findById(userId)
        const address = await addressCollection.findOne({userId:userId})
        return res.render('User/profile',{
            user,
            address,
            page:null
        })
    } catch (error) {
       console.error('something went wrong') 
    }
}

exports.editProfile = async (req,res) =>{
    try {
        console.log('hekki')
        //validation
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            console.log('validation error',errors)
            const validationErrors = errors.array().reduce((acc, error) => {
                acc[error.path] = error.msg;
                return acc;
            }, {})
            return res.json({validationError:true, validationErrors})
        }
        userId = req.session.user
        const {username, phone} = req.body
        const user = await usersCollection.findById(userId)

        if(user.username === username && user.phone === phone){
            return res.json({noChange:true,message:'sorry you didit make any changes'})
        }
        else{
            user.username = username
            user.phone = phone

            await user.save()

            return res.json({success:true,message:'successfully updated your profile'})
        } 
        
    } catch (error) {
        console.error('something went wrong',error)
    }
}


exports.setNewPassword = async (req,res)=>{
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.user
    const user = await usersCollection.findById({_id:userId});

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
        return res.json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });

}

exports.addAddress = async (req,res) =>{
    try {
        req.session.source = req.query.profile
        console.log('source details',req.session.source)
        user = req.session.user
        currAddress = null
       return res.render('User/addAddress',{
        user,
        page:null,
        currAddress
    }) 
    } catch (error) {
       console.log('something went wron',error) 
    }
}

exports.postAddress = async (req,res) =>{
    try {
        const source = req.session.source
       //validation 
       const errors = validationResult(req) 
       if(!errors.isEmpty()){
        const validationErrors = errors.array().reduce((acc,error)=>{
        acc[error.path]=error.msg
        return acc
        },{})
        return res.json({validationError:true,validationErrors}) 
       }

       const userId  = req.session.user

       console.log('defalut address',req.body.defaultAddress)

       const newAddress = {
        fullName:req.body.fullName,
        country:req.body.country,
        localAddress:req.body.localAddress,
        city:req.body.city,
        state:req.body.state,
        pinCode:req.body.pincode,
        mobile:req.body.mobile,
        email:req.body.email,
        typeOfAddress:req.body.typeOfAddress,
        isDefault:req.body.defaultAddress || false
       }

       const address = await addressCollection.findOne({userId:userId})

       //user dont have any address
       if(!address){
        newAddress.isDefault = true
        await addressCollection.create({userId:userId,addresses:[newAddress]})
        return res.json({success:true,message:'address added successfully',source})
       }

       if(address.addresses.length === 3){
        return res.json({success:false,message:'sorry you cannot add more than three address!',source})
       }

       if(newAddress.isDefault){
        address.addresses.forEach((addr)=> (addr.isDefault = false))
        newAddress.isDefault = true
       }

       //adding multiple address
       address.addresses.push(newAddress)
       await address.save()
       return res.json({success:true,message:'address added successfully',source})
       
    } catch (error) {
       console.error('somethig went wrong',error) 
    }
}


exports.getEditAddress = async(req,res)=>{
    try {
        req.session.source = req.query.profile
        user = req.session.user
        addressId = req.params.id
        const address = await addressCollection.findOne({userId:user})
        if(address){
            const currAddress = address.addresses.find(element => element._id.toString() == addressId )
           
            res.render('User/addAddress',{
                user,
                page:null,
                currAddress
            })

        }
        
    } catch (error) {
       console.error('something went wrong',error) 
    }
}

exports.editAddressPost = async (req,res)=>{ 
    try {
        const source = req.session.source
       //validation errror
       const errors = validationResult(req) 
       if(!errors.isEmpty()){
        const validationErrors = errors.array().reduce((acc,error)=>{
        acc[error.path]=error.msg
        return acc
        },{})
        return res.json({validationError:true,validationErrors}) 
       }

       addressId = req.params.id
       userId = req.session.user

       console.log('defalut address',req.body.defaultAddress)

       const address = await addressCollection.findOne({userId:userId})
       if(address){
       const editedAddress =  address.addresses.find(element => element._id.toString() === addressId)
       if(editedAddress){
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

        return res.json({success:true,message:'successfuly updated the address',source})
      }
       return res.status(404).json({success:false,message:'address not found',source})
    }else{
        return res.status(404).json({success:false,message:'user document not found',source})
    }       
    } catch (error) {
        console.error('something went wrong',error)
    }
}

exports.deleteAddress = async (req,res)=>{
    try {
       const userId =  req.session.user
       const addressId = req.params.id
       const address = await addressCollection.findOne({userId:userId})
       if(address){
         const currAddress = address.addresses.find(element => element._id.toString() === addressId)
         if(currAddress){
            const isDefault = currAddress.isDefault
            address.addresses.pull(currAddress._id)

            //if the deleted address was a default address
            if (isDefault && address.addresses.length > 0) {
                address.addresses[0].isDefault = true; 
            }

            await address.save()
           return res.json({success:true,message:'successfully deleted the address'})
         }
         
         return res.status(404).json({success:false,message:'address not found'})
       }
       return res.status(404),json({success:false,message:'address document not found'})

    } catch (error) {
       console.error('something went wrong',error) 
    }
}


exports.loadOrderHistory = async (req,res)=>{
    try {
        const user = req.session.user 
        const orders = await orderCollection.find({userId:user})
        console.log('server side',orders)
       
        res.render('User/orderHistory',{
            user,
            orders,
            page:null
           
        })
    } catch (error) {
       console.error('something went wrong ') 
    }
}

exports.cancelProduct = async (req,res)=>{
    try {
        const {orderId, itemId} = req.body
        console.log('req.body',req.body)

        const orders = await orderCollection.findOne({_id:orderId})

        if (!orders) {
            return res.json({ success: false, message: 'Order not found' });
        }

        const itemIndex = orders.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.json({ success: false, message: 'Item not found in order' });
        }

        
        const { variantId, quantity } = orders.items[itemIndex];
        console.log('quantity',quantity)
        console.log('variantid',variantId)

        orders.items.splice(itemIndex, 1);
        await orders.save()

        
         const variant = await variantCollection.findOne({ _id: variantId });
        if (!variant) {
            return res.status(500).json({ success: false, message: 'Variant not found' });
        }


        variant.sizes[0].stock += quantity;

        // Save the updated variant
        const updatedVariant = await variant.save();
        console.log('Updated variant:', updatedVariant);
            return res.json({success:true,message:'order cancel successfully'})

    } catch (error) {
        console.error('somethig went wrong',error)
    }
}

//=========profile end=========// 

exports.getCheckOut = async (req,res) =>{
    try {
        user = req.session.user
        const cart = await cartCollection.findOne({userId:user}).populate('items.product')
        const address = await addressCollection.findOne({userId:user})
        res.render('User/checkout',{
            user,
            page:null,
            cart,
            address
        })
    } catch (error) {
        console.error('somehing went wrong',error)
    }
}

exports.placeOrder = async (req,res)=>{
    try {
        const userId = req.session.user
        const {deliveryAddress, paymentMethod} = req.body
        console.log('delevery address',deliveryAddress)
        
        const address = await addressCollection.findOne({userId})
        if(!address){
            return res.json({error:true,message:'sorry address not found'})
        }
        

        const userAddress = address.addresses.find(addr => addr._id.toString() === deliveryAddress)
        if(!userAddress){
            return res.json({error:true, message:'sorry address not found'})
        }

        if(paymentMethod == 'RAZORPAY'){
            return res.json({error:true,message:'sorry only cash on delevery is available'})
        }
        
        const cart = await cartCollection.findOne({userId:userId}).populate({
            path:'items.product',
            populate:{
                path:'variants'
            }
        })
        console.log('cart',cart)
        console.log('productID',cart.items.product)

        if(!cart || cart.items.length === 0){
            console.log('cart is empty')
            return res.json({error:true,message:'your cart is empty'})
        }
        
        const orderItems = cart.items.map(item => ({
            productId: item.product._id,
            productName: item.product.productName,   
            variantId: item.product.variants[0]._id, 
            size: item.product.variants[0].sizes[0].size, 
            image:item.product.variants[0].images[0],
            price: item.product.variants[0].price,
            quantity: item.quantity,
            itemTotal: item.itemTotal
        }));

        const totalAmount = cart.totalPrice


        //store order details
        const orderDetails ={
            userId,
            deliveryAddress:{
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
            paymentMethod,
            paymentStatus:false,
            orderStatus: 'pending',
            totalAmount
        }

        const newOrder = new orderCollection(orderDetails)
        await newOrder.save()

        //update the stock
        for (const item of orderItems) {
            await variantCollection.updateOne(
              { _id: item.variantId, "sizes.size": item.size },
              { $inc: { "sizes.$.stock": -item.quantity } }
            );
          }
        
         console.log('here okay')
        //clear user cart
        await  cartCollection.findOneAndUpdate({userId:userId }, { $set: { items: [] } });
        console.log('here not okay')
        return res.json({success:true,message:'order placed successfully'})


    } catch (error) {
        console.error('something went wrong',error)
        return res.json({ error: true, message: 'An error occurred while placing the order' });
    }
}

exports.userLogout = async (req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            res.send(err)
        }else{
            res.redirect('/')
        }
    })
}
