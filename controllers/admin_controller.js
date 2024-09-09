const bcrypt = require('bcrypt')
const usersCollection = require('../models/usersModel')
const categoryCollection = require('../models/categoryModel')
const brandCollection = require('../models/brandModel')
const productCollection = require('../models/productModel')
const variantCollection = require('../models/variantModel')
const orderCollection = require('../models/orderModel')

//validation
const { validationResult } = require('express-validator')
const provalidation = require('../middleware/productValidation')

const upload = require('../config/multerConfig')
const path = require('path')
const { request } = require('express')
const { json } = require('body-parser')

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
      console.error('something went wrong',error)
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
   .populate('variants')
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
   try {
      const {productName, category, brand, description} = req.body
      

      const variants = req.body.variants

      //  checking validation error
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
     }

     //checking the product is existed
     const productCheck = await productCollection.findOne({productName})
     if(productCheck){
      return res.json({success:false,message:'sorry the product is already exisited!'})
     }

     const regex = /.*[\/\\]public[\/\\](.*)/;
     
     const uploadedFiles =req.files?req.files.map(file =>{
      const match = file.path.match(regex)
      return match ? match[1] : null 
     }).filter(path => path !== null): []

     const variantImagesMap = new Map();

     uploadedFiles.forEach(filePath => {
         // Assuming file is an object with fieldname, adjust as necessary
         const file = req.files.find(f => f.path.includes(filePath));
     
         if (file && file.fieldname) {
             // Extract the variant index from the field name (e.g., "variants[0][images]")
             const variantIndexMatch = file.fieldname.match(/variants\[(\d+)\]\[images\]/);
             
             if (variantIndexMatch) {
                 const variantIndex = parseInt(variantIndexMatch[1]);
                 
                 // If the Map does not have the variant index, initialize it with an empty array
                 if (!variantImagesMap.has(variantIndex)) {
                     variantImagesMap.set(variantIndex, []);
                 }
                 
                 // Store only the relative path (after "public") in the Map
                 variantImagesMap.get(variantIndex).push(filePath);
             } else {
                 // Handle cases where match fails
                 console.error(`fieldname match failed for: ${file.fieldname}`);
             }
         } else {
             // Handle cases where file or file.fieldname is undefined
             console.error('file or file.fieldname is undefined', file);
         }
     });

     //create new Product
     const newProduct = new productCollection({
      productName,
      category,
      brand,
      productDescription: description,
      variants: []
     })
     const savedProduct = await newProduct.save()

     //iterate variants array and saving
     for (let i = 0;i <variants.length;i++){
      const variant = variants[i]
      const newVariant = new variantCollection({
         product:savedProduct._id,
         color:variant.color,
         price:variant.price,
         sizes:variant.sizes,
         images:variantImagesMap.get(i) || []
      })
      await newVariant.save()

      savedProduct.variants.push(newVariant._id)
   }

     await savedProduct.save()
     return res.json({success:true,message:'product added successfully'})

   } catch (error) {
      console.log('something went wrong',error)
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
      const productId = req.params.id
      const product = await productCollection.findById(productId).populate('variants')
      const categories = await categoryCollection.find({deleted:false})
      const brands = await brandCollection.find({deleted:false})

      let imagePath = {}
      product.variants.forEach((variant, index)=>{
         const imageKey0 = `variant${index}-image0`
         const imageKey1 = `variant${index}-image1`
         const imageKey2 = `variant${index}-image2`
         const imagekey3 = `variant${index}-image3`

         imagePath[imageKey0] = variant.images[0]
         imagePath[imageKey1] = variant.images[1]
         imagePath[imageKey2] = variant.images[2]
         imagePath[imagekey3] = variant.images[3]

      })


      res.render('Admin/addProduct',{
         product,
         categories, 
         brands,
         imagePath
      })
   } catch (error) {
      console.log('error',error)
   }
}

// exports.postUpdatedProduct = async (req,res)=>{
//    const regex = /.*[\/\\]public[\/\\](.*)/;

//    console.log('Full request body:', req.body);
//    const {productName, category, brand,  description} = req.body

//    const variants = req.body.variants
//    console.log('variants',variants)

//    const uploadedFiles = req.files?req.files.map(file =>{
//       const match  = file.path.match(regex)
//       return match ? match[1]:null
//    }).filter(path => path !== null):[]
//    console.log('images:',images)

   
//    try {
//       const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
//       const productId = req.params.id
//       const updatedProduct ={  
//          productName,
//          category,
//          brand,
//          variants:parsedVariants,
//          productDescription:description,
//          images:images.length > 0 ? images : undefined
//        }
//        await productCollection.findByIdAndUpdate(productId,updatedProduct,{new:true})
//        return res.json({success:true,message:'update product successfully'})
//    } catch (error) {
//       console.log(error)
//       return res.json({success:false,message:'faild'})
//    }
// }

exports.postUpdatedProduct = async (req,res) =>{
   try {
       //  checking validation error
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
    }

      const {productName , category, brand, description} = req.body
      const variants = req.body.variants

      const productId = req.params.id  //product id      
      
      const existingProduct = await productCollection.findById(productId)
      if(!existingProduct){
         return res.json({success:false,message:'sorry the product is not existed!'})
      }
      
      //update product details
      existingProduct.productName = productName
      existingProduct.category = category
      existingProduct.brand = brand
      existingProduct.productDescription = description

      const regex = /.*[\/\\]public[\/\\](.*)/;
      const uploadedFiles = req.files ? req.files.map(file => {
          const match = file.path.match(regex);
          return match ? match[1] : null;
      }).filter(path => path !== null) : [];

      const variantImagesMap = new Map();

        uploadedFiles.forEach(filePath => {
            const file = req.files.find(f => f.path.includes(filePath));
            if (file && file.fieldname) {
                const variantIndexMatch = file.fieldname.match(/variants\[(\d+)\]\[images\]/);
                if (variantIndexMatch) {
                    const variantIndex = parseInt(variantIndexMatch[1]);
                    if (!variantImagesMap.has(variantIndex)) {
                        variantImagesMap.set(variantIndex, []);
                    }
                    variantImagesMap.get(variantIndex).push(filePath);
                }
            }
        });

      //update variants  
      for(i=0;i<variants.length;i++){
         const variantId = existingProduct.variants[i]
         const variant = variants[i]
         const existingVariant = await variantCollection.findOne({product:productId,_id:variantId})
         console.log('variant id',variantId)

         if(existingVariant){
            //update existing variant
            existingVariant.color = variant.color
            existingVariant.price = variant.price
            
            // Update sizes
            existingVariant.sizes = variant.sizes.map(size => ({
               size: size.size,
               stock: size.stock
           }));

           if (variantImagesMap.has(i)) {
            const newImages = variantImagesMap.get(i);
            // Ensure we keep 4 images
            existingVariant.images = [
                ...newImages,
                ...existingVariant.images.slice(newImages.length)
            ].slice(0, 4);
        }

            // existingVariant.images

            await existingVariant.save()
         }else{
            console.log('hello',uploadedFiles)
           //add new variant
           const updateNewVariant = new variantCollection({
            product:productId,
            color:variant.color,
            price:variant.price,
            sizes:variant.sizes,
            images:uploadedFiles 
           })
           console.log('new variant',updateNewVariant)
           await updateNewVariant.save()  //add new variant

           existingProduct.variants.push(updateNewVariant._id)  //add the new variant reference to the product collection
         }
      }

      //saving the updated product
      await existingProduct.save()

      return res.json({success:true,message:'successfully updated the product'})
   } catch (error) {
      console.error('something went wrong',error)
   }
}


exports.loadOrderManagment = async (req,res) =>{
   try {

   const searchQuery = req.query.search || ''
   const page = parseInt(req.query.page) || 1
   const limit = parseInt(req.query.limit) ||10
   const skip = (page-1)*limit

   //search Criteria
   
   const totalProducts = await orderCollection.countDocuments()
   const totalPages = Math.ceil(totalProducts/limit)

      const orders = await orderCollection.find({}).skip(skip).limit(limit)
      res.render('Admin/orderManagment',{
         orders,
         currentPage:page,
         limit,
         totalPages
      })
   } catch (error) {
      console.error('something went wrong',error)
   }
}

exports.cancelProductAdm = async (req,res) =>{
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
      console.error('something went wrong',error)
   }
}


exports.adminLogout = (req,res)=>{
   req.session.destroy((err)=>{  
      if(err) console.err(err)
         else res.redirect('/admin')
   })
}

