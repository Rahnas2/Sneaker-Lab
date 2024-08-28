const bcrypt = require('bcrypt')
const usersCollection = require('../models/usersModel')
const categoryCollection = require('../models/categoryModel')
const brandCollection = require('../models/brandModel')
const productCollection = require('../models/productModel')

//validation
const { validationResult } = require('express-validator')
const provalidation = require('../middleware/productValidation')

const upload = require('../config/multerConfig')
const path = require('path')
const { request } = require('express')

exports.adminLogin = (req,res)=>{
   if(!req.session.admin){
      res.render('Admin/signin')
   }else{
      res.redirect('/admin/home')
   }
   
}

exports.adminLoginPost = async(req,res)=>{
   const {email,password} = req.body
   try {

      const adminCheck = await usersCollection.findOne({email:email,isAdmin:true})
      if(adminCheck){
         const passwordCheck = await bcrypt.compare(password,adminCheck.password)
         if(passwordCheck){
            req.session.admin =  true
            return res.json({success:true})
         }else{
            return res.json({error:'Invalid password'})
         }
      }else{
         return res.json({error:'Admin not found'})
      }

   } catch (error) {
      console.error(error);
      
   }
 
}

exports.home = (req,res)=>{
   res.render('Admin/adminHome')
}

//user mangment start 

exports.userManagment = async(req,res)=>{
   try {
         const searchQuery = req.query.search || ''
         const page = parseInt(req.query.page) || 1
         const limit = parseInt(req.query.limit) || 10
         const skip = (page - 1)*limit

         const searchCriteria ={
              isAdmin:false,
              $or:[
                   {username: new RegExp(searchQuery,'i')}, 
                   {email: new RegExp(searchQuery,'i')}
              ]
         }

         let usersList = await usersCollection.find(searchCriteria)
         .skip(skip)
         .limit(limit)

         let totalUsers = await usersCollection.countDocuments({isAdmin:false}) //total users count
         const totalPages = Math.ceil(totalUsers/limit)

         res.render('Admin/UserManagment',{
            usersList,
            currentPage:page,
            totalPages,
            limit,
            searchQuery
         })
   } catch (error) {
      console.error(error)
   }
}

exports.blockUser = async(req,res)=>{
   try {
      const user = await usersCollection.findByIdAndUpdate(req.params.userId,{isBlock:true},{new:true})
      const message = 'sucessfully block the user'
      req.session.user = undefined
      console.log(req.session.user)
      console.log('dslfjk;lds',req.session)
      return res.json({success:true, user, message})
   } catch (error) {
      res.status(500).json({success:false , message:'error while blocking the user'})
   }
}

exports.unblockUser = async(req,res)=>{
   try {
      const user = await usersCollection.findByIdAndUpdate(req.params.userId,{isBlock:false},{new:true})
      const message = 'sucessfully unblock the user'
      req.session.user = user.email
      return res.json({success:true, user, message})
   } catch (error) {
      res.status(500).json({success:false , message:'error while blocking the user'})
   }
}

//user managment end

//category managment start

exports.categoryManagment = async(req,res)=>{

   const searchQuery = req.query.search || ''
   const page = parseInt(req.query.page) || 1
   const limit = parseInt(req.query.limit) || 10
   const skip = (page-1)*limit

   const searchCriteria = {deleted:false,
      $or:[
         {categoryName: new RegExp(searchQuery,'i')},
         {categoryDescription: new RegExp(searchQuery,'i')}

      ]
   }

   const categoryList = await categoryCollection.find(searchCriteria).skip(skip).limit(limit)

   const totalCategorys = await categoryCollection.countDocuments({deleted:false})
   const totalPages = Math.ceil(totalCategorys/limit)

   res.render('Admin/categoryManagment',{
      categoryList,
      currentPage:page,
      totalPages,
      limit,
      searchQuery
   })
}

exports.addCategory = async(req,res)=>{
   try {
      const { categoryName, categoryDescription } = req.body

      const categoryExist = await categoryCollection.findOne({categoryName})

      if(categoryExist){
         return res.json({success:false,error:'category alredy exsist'})
      }

      const newCategory = new categoryCollection({
         categoryName,
         categoryDescription
     
      })

      await newCategory.save()

      return res.json({success:true,message:'category successfully added'})

   } catch (error) {
      console.error('error',error)
   }
}

exports.softDeleteCategory = async(req,res)=>{
   try {
      const categoryId = req.params.id
      await categoryCollection.findByIdAndUpdate(categoryId,{deleted:true})
      console.log("helo",categoryId)
      return res.json({success:true,message:'category deleted successfully'})
   } catch (error) {
      console.error('error during soft delete',error)
      return res.status(500).json({success:false,message:'faild category delete'})
   }
}

//category managment end 

//brand managment start
exports.brandManagment = async(req,res)=>{

   const searchQuery = req.query.search || ''
   const page = parseInt(req.query.page) || 1
   const limit = parseInt(req.query.limit) || 10
   const skip = (page-1)*limit

   const searchCriteria = {deleted:false,
      $or:[
         {brandName: new RegExp(searchQuery,'i')},
         {brandDescription: new RegExp(searchQuery,'i')}

      ]
   }

   const brandList = await brandCollection.find(searchCriteria).skip(skip).limit(limit)

   const totalBrands = await brandCollection.countDocuments({deleted:false})
   const totalPages = Math.ceil(totalBrands/limit)

   res.render('Admin/brandManagment',{
      brandList,
      currentPage:page,
      totalPages,
      limit,
      searchQuery
   })
}

exports.addBrand = async(req,res)=>{
   try {
      const { brandName , brandDescription } = req.body

      const brandExist = await brandCollection.findOne({brandName})
     
      if(brandExist){
         return res.json({success:false,error:'brand already exist'})
      }

      const newBrand = new brandCollection({
         brandName,
         brandDescription
      })

      await newBrand.save()

      return res.json({success:true,message:'brand added successfull'})

   } catch (error) {
      console.log('error',error)
   }
}

exports.softDeleteBrand = async(req,res)=>{
   try {
      const brandId = req.params.id

      await brandCollection.findByIdAndUpdate(brandId,{deleted:true})

      return res.json({success:true,message:'brand deleted successfully'})
   } catch (error) {
      return res.status(500).json({success:false,message:'faild brand delete'})
   }
}

//brand managment end

//product managment start

exports.productManagment = async(req,res)=>{

   const searchQuery = req.query.search || ''
   const page = parseInt(req.query.page) || 1
   const limit = parseInt(req.query.limit) ||10
   const skip = (page-1)*limit

   //search Criteria
   const searchCriteria = {deleted:false,
      $or:[
         {productName:new RegExp(searchQuery,'i')},
         {
            category:{
               $in:(await categoryCollection.find({categoryName: new RegExp(searchQuery,'i')}))
            }
         },
         {
            brand:{
               $in:(await brandCollection.find({brandName: new RegExp(searchQuery,'i')}))
            }
         },
         ...(isNaN(Number(searchQuery)) ? [] : [{ 
            variants: { 
                $elemMatch: { stock: Number(searchQuery) } 
            } 
        }]) 
    ]
   }
   const totalProducts = await productCollection.countDocuments({deleted:false})
   const totalPages = Math.ceil(totalProducts/limit)

   const productList = await productCollection.find(searchCriteria)
   .populate('category','categoryName')
   .populate('brand','brandName')
   .skip(skip)
   .limit(limit)
   res.render('Admin/productManagment',{
      productList,
      currentPage:page,
      limit,
      totalPages
   })
}

exports.getaddProduct = async(req,res)=>{
   try {
      const product = null
      const categories = await categoryCollection.find({deleted:false}) //fetch all the available categories
      const brands = await brandCollection.find({deleted:false}) //fetch all availabel brands
   

      res.render('Admin/addProduct',{product,categories,brands})

   } catch (error) {
      
   }
   
}

exports.postaddproduct = async(req,res)=>{
   const regex = /.*\\public(.*)/;

   const {productName, category, brand,  description} = req.body
   const variants = req.body.variants
   console.log('variants',variants)
   const images = req.files?req.files.map(file => file.path.match(regex)[1]):[]
   console.log('images',images)
   
   try {
      //check validation
      const errors = validationResult(req)
      if(!errors.isEmpty()){
         return res.json({valdationError:errors.array()})
      }
      let parsedVariants;
        try {
            parsedVariants = JSON.parse(variants);
            
        } catch (parseError) {
            console.error("Error parsing variants:", parseError);
            return res.status(400).json({ success: false, message: 'Invalid variants data' });
        }
      
      
      const productCheck = await productCollection.findOne({productName})

      if(productCheck){
        return res.json({success:false,message:'sorry, the product is already existed'})
      }
  
      const newProduct = new productCollection({
        productName,
        category,
        brand,
        variants:parsedVariants,
        productDescription:description,
        images
      })
      console.log(newProduct)
      await newProduct.save()

      return res.json({success:true,message:'product added successfully'})


  }catch (error) {
   console.log(error)
      return res.status(500).json({success:false,message:'error adding product',error})
  } 
} 
  
exports.softDeleteProduct = async(req,res)=>{
   try {
      const productId = req.params.id
      console.log(productId)
     await productCollection.findByIdAndUpdate(productId,{deleted:true})
     return res.json({success:true,message:'soft delete successfully completed'})
   } catch (error) {
      console.log('error')
      return res.json({success:false,message:'soft deletion fail'})
   }
     
}  
  
exports.getEditProduct = async(req,res)=>{
   try {
      console.log('Full request body:', req.body);
      const productId = req.params.id
      const product = await productCollection.findById(productId)
      const categories = await categoryCollection.find({deleted:false})
      const brands = await brandCollection.find({deleted:false})

      res.render('Admin/addProduct',{
         product,
         categories, 
         brands
      })
   } catch (error) {
      console.log('error',error)
   }
}

exports.postUpdatedProduct = async (req,res)=>{
   const regex = /.*\\public(.*)/;

   console.log('Full request body:', req.body);
   const {productName, category, brand,  description} = req.body
   const variants = req.body.variants
   console.log('variants',variants)
   const images = req.files?req.files.map(file => file.path.match(regex)[1]):[]
   console.log(images)
   console.log(req.body)
   try {
      const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      const productId = req.params.id
      const updatedProduct ={  
         productName,
         category,
         brand,
         variants:parsedVariants,
         productDescription:description,
         images:images.length > 0 ? images : undefined
       }
       await productCollection.findByIdAndUpdate(productId,updatedProduct,{new:true})
       return res.json({success:true,message:'update product successfully'})
   } catch (error) {
      console.log(error)
      return res.json({success:false,message:'faild'})
   }
}


exports.adminLogout = (req,res)=>{
   req.session.destroy((err)=>{  
      if(err) console.err(err)
         else res.redirect('/admin')
   })
}

