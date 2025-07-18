const bcrypt = require('bcrypt')
const usersCollection = require('../models/usersModel')
const categoryCollection = require('../models/categoryModel')
const brandCollection = require('../models/brandModel')
const productCollection = require('../models/productModel')
const variantCollection = require('../models/variantModel')
const orderCollection = require('../models/orderModel')
const walletCollection = require('../models/walletModel')

const mongoose = require('mongoose')

//validation
const { validationResult } = require('express-validator')
const HttpStatusCode = require('../utils/statsCode')

exports.adminLogin = (req, res) => {
   if (!req.session.admin) {
      res.render('Admin/signin')
   } else {
      res.redirect('/admin/dashBoard')
   }

}

exports.adminLoginPost = async (req, res, next) => {
   try {
      const { email, password } = req.body
      const adminCheck = await usersCollection.findOne({ email: email, isAdmin: true })
      if (adminCheck) {
         const passwordCheck = await bcrypt.compare(password, adminCheck.password)
         if (passwordCheck) {
            req.session.admin = true
            return res.json({ success: true })
         } else {
            return res.status(HttpStatusCode.BAD_REQUEST).json({ error: 'Invalid password' })
         }
      }

      return res.status(HttpStatusCode.FORBIDDEN).json({ error: 'Admin not found' })
   } catch (error) {
      next(error)
   }
}

exports.userManagment = async (req, res, next) => {
   try {
      const searchQuery = req.query.search || ''
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 10
      const skip = (page - 1) * limit

      const searchCriteria = {
         isAdmin: false,
         $or: [
            { username: new RegExp(searchQuery, 'i') },
            { email: new RegExp(searchQuery, 'i') }
         ]
      }

      let usersList = await usersCollection.find(searchCriteria)
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(limit)

      let totalUsers = await usersCollection.countDocuments({ isAdmin: false }) //total users count
      const totalPages = Math.ceil(totalUsers / limit)

      res.render('Admin/userManagment', {
         usersList,
         currentPage: page,
         totalPages,
         limit,
         searchQuery
      })
   } catch (error) {
      next(error)
   }
}

exports.blockUser = async (req, res, next) => {
   try {
      const user = await usersCollection.findByIdAndUpdate(req.params.userId, { isBlock: true }, { new: true })
      const message = 'sucessfully block the user'
      req.session.user = undefined
      console.log('lock user ', req.session.user)

      return res.status(HttpStatusCode.OK).json({ success: true, user, message })
   } catch (error) {
      next(error)
   }
}

exports.unblockUser = async (req, res, next) => {
   try {
      const user = await usersCollection.findByIdAndUpdate(req.params.userId, { isBlock: false }, { new: true })
      const message = 'sucessfully unblock the user'
      req.session.user = user._id
      return res.status(HttpStatusCode.OK).json({ success: true, user, message })
   } catch (error) {
      next(error)
   }
}

//user managment end

//product managment start

exports.productManagment = async (req, res, next) => {

   const searchQuery = req.query.search || ''
   const page = parseInt(req.query.page) || 1
   const limit = parseInt(req.query.limit) || 10
   const skip = (page - 1) * limit

   //search Criteria
   const searchCriteria = {
      $or: [
         { productName: new RegExp(searchQuery, 'i') },
         {
            category: {
               $in: (await categoryCollection.find({ categoryName: new RegExp(searchQuery, 'i') }))
            }
         },
         {
            brand: {
               $in: (await brandCollection.find({ brandName: new RegExp(searchQuery, 'i') }))
            }
         },
         ...(isNaN(Number(searchQuery)) ? [] : [{
            variants: {
               $elemMatch: { stock: Number(searchQuery) }
            }
         }])
      ]
   }
   const totalProducts = await productCollection.countDocuments()
   const totalPages = Math.ceil(totalProducts / limit)

   const productList = await productCollection.find(searchCriteria)
      .populate('category', 'categoryName')
      .populate('brand', 'brandName')
      .populate('variants')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
   res.render('Admin/ProductManagment', {
      productList,
      currentPage: page,
      limit,
      totalPages,
      searchQuery
   })
}

exports.getaddProduct = async (req, res) => {
   try {
      const product = null
      const categories = await categoryCollection.find({ deleted: false }) //fetch all the available categories
      const brands = await brandCollection.find({ deleted: false }) //fetch all availabel brands


      res.render('Admin/addProduct', { product, categories, brands })

   } catch (error) {
      next(error)
   }

}

exports.postaddproduct = async (req, res, next) => {
   try {
      const { productName, category, brand, description } = req.body

      const variants = req.body.variants

      //  checking validation error
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
         const validationErrors = errors.array().reduce((acc, error) => {
            acc[error.path] = error.msg
            return acc
         }, {})

         return res.status(HttpStatusCode.BAD_REQUEST).json({ validationError: true, validationErrors })
      }

      //checking the product is existed
      const productCheck = await productCollection.findOne({ productName: { $regex: new RegExp(`^${productName}$`, 'i') } })
      if (productCheck) {
         return res.status(HttpStatusCode.CONFLICT).json({ success: false, message: 'sorry the product is already exisited!' })
      }

      const regex = /.*[\/\\]public[\/\\](.*)/;

      const uploadedFiles = req.files ? req.files.map(file => {
         const match = file.path.match(regex)
         return match ? match[1] : null
      }).filter(path => path !== null) : []

      if (uploadedFiles.length < (variants.length * 4)) {
         return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: 'all images are required' })
      }

      const variantImagesMap = new Map();

      uploadedFiles.forEach(filePath => {
         // Assuming file is an object with fieldname, adjust as necessary
         const file = req.files.find(f => f.path.includes(filePath));

         if (file && file.fieldname) {
            console.log(`Processing file: ${file.fieldname}, Path: ${filePath}`);
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

      variants.forEach(variant => {
         if (!variant.sizes) {
            return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: 'please select atleast one size and the stock' })
         }
      })

      console.log('creating new product..')
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
      for (let i = 0; i < variants.length; i++) {
         const variant = variants[i]
         const newVariant = new variantCollection({
            product: savedProduct._id,
            color: variant.color,
            price: variant.price,
            sizes: variant.sizes,
            images: variantImagesMap.get(i) || []
         })
         await newVariant.save()

         savedProduct.variants.push(newVariant._id)
      }

      await savedProduct.save()
      return res.status(HttpStatusCode.CREATED).json({ success: true, message: 'product added successfully' })

   } catch (error) {
      next(error)
   }
}

exports.toggleProductStatus = async (req, res, next) => {
   try {
      const productId = req.params.id
      console.log(productId)
      const product = await productCollection.findById(productId)
      const status = product.deleted
      await productCollection.findByIdAndUpdate(productId, { deleted: !status })
      const message = status ? 'Activated' : 'De-activated'
      return res.json({ success: true, message })
   } catch (error) {
      next(error)
   }
}

exports.getEditProduct = async (req, res, next) => {
   try {
      const productId = req.params.id
      const product = await productCollection.findById(productId).populate('variants')
      const categories = await categoryCollection.find({ deleted: false })
      const brands = await brandCollection.find({ deleted: false })

      let imagePath = {}
      product.variants.forEach((variant, index) => {
         const imageKey0 = `variant${index}-image0`
         const imageKey1 = `variant${index}-image1`
         const imageKey2 = `variant${index}-image2`
         const imagekey3 = `variant${index}-image3`

         imagePath[imageKey0] = variant.images[0]
         imagePath[imageKey1] = variant.images[1]
         imagePath[imageKey2] = variant.images[2]
         imagePath[imagekey3] = variant.images[3]

      })


      res.render('Admin/addProduct', {
         product,
         categories,
         brands,
         imagePath
      })
   } catch (error) {
      next(error)
   }
}


exports.postUpdatedProduct = async (req, res, next) => {
   try {
      //  checking validation error
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
         const validationErrors = errors.array().reduce((acc, error) => {
            acc[error.path] = error.msg
            return acc
         }, {})
         console.log(validationErrors)
         return res.status(HttpStatusCode.BAD_REQUEST).json({ validationError: true, validationErrors })
      }

      const { productName, category, brand, description } = req.body
      const variants = req.body.variants

      const productId = req.params.id  //product id      

      const existingProduct = await productCollection.findById(productId)
      if (!existingProduct) {
         return res.status(HttpStatusCode.NOT_FOUND).json({ success: false, message: 'sorry, the product does not exist!' })
      }

      const productNameCheck = await productCollection.findOne({
         productName: { $regex: new RegExp(`^${productName}$`, 'i') }, // Case-insensitive name check
         _id: { $ne: productId } // Exclude the current product from the check
      });

      if (productNameCheck) {
         return res.status(HttpStatusCode.CONFLICT).json({ success: false, message: 'sorry the product name is already used' })
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
            console.log(`Processing file: ${file.fieldname}, Path: ${filePath}`);
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
      // const updatedVariantIds = [];
      for (let i = 0; i < variants.length; i++) {
         const variant = variants[i]; // Get the current variant

         if (!variant.sizes) {
            return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: 'please add atleast one size and stock to the varaints' })
         }

         let existingVariant;

         // Find existing variant by ID and product association
         existingVariant = await variantCollection.findOne({ color: variant.color, product: productId });

         if (existingVariant) {
            //update existing variant
            existingVariant.color = variant.color
            existingVariant.price = variant.price
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


            await existingVariant.save()
            // updatedVariantIds.push(existingVariant._id);
         } else {

            //add new variant
            const updateNewVariant = new variantCollection({
               product: productId,
               color: variant.color,
               price: variant.price,
               sizes: variant.sizes,
               images: variantImagesMap.get(i) || []
            })
            console.log('new variant', updateNewVariant)
            await updateNewVariant.save()  //add new variant

            existingProduct.variants.push(updateNewVariant._id)  //add the new variant reference to the product collection
         }
         //saving the updated product
         await existingProduct.save()
      }

      return res.json({ success: true, message: 'successfully updated the product' })
   } catch (error) {
      next(error)
   }
}

//Product managment start

//order management start

exports.loadOrderManagment = async (req, res, next) => {
   try {

      const searchQuery = req.query.search || ''
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 10
      const skip = (page - 1) * limit

      //search Criteria
      let searchCriteria = {}

      if (searchQuery) {
         // Try parsing searchQuery to ObjectId (if valid)
         let objectIdSearch = null
         if (mongoose.Types.ObjectId.isValid(searchQuery)) {
            objectIdSearch = new mongoose.Types.ObjectId(searchQuery)
         }

         searchCriteria = {
            $or: [
               objectIdSearch ? { _id: objectIdSearch } : {}, // only add this if valid ObjectId
               { 'items.productName': { $regex: searchQuery, $options: 'i' } },
               { 'items.price': isNaN(Number(searchQuery)) ? null : Number(searchQuery) },
               { 'items.quantity': isNaN(Number(searchQuery)) ? null : Number(searchQuery) },
               { 'items.itemTotal': isNaN(Number(searchQuery)) ? null : Number(searchQuery) },
               { paymentMethod: { $regex: searchQuery, $options: 'i' } },
               { 'items.status': { $regex: searchQuery, $options: 'i' } }
            ].filter(condition => Object.keys(condition).length) // remove any empty {}
         }
      }

      const totalProducts = await orderCollection.countDocuments()
      const totalPages = Math.ceil(totalProducts / limit)

      const orders = await orderCollection.find(searchCriteria).sort({ createdAt: -1 }).skip(skip).limit(limit)
      res.render('Admin/orderManagment', {
         orders,
         currentPage: page,
         limit,
         totalPages,
         searchQuery
      })
   } catch (error) {
      next(error)
   }
}

exports.cancelProductAdm = async (req, res, next) => {
   try {
      const { orderId, itemId } = req.body
      console.log('req.body', req.body)

      const orders = await orderCollection.findOne({ _id: orderId })

      if (!orders) {
         return res.status(HttpStatusCode.NOT_FOUND).json({ success: false, message: 'Order not found' });
      }

      const itemIndex = orders.items.findIndex(item => item._id.toString() === itemId);
      if (itemIndex === -1) {
         return res.status(HttpStatusCode.NOT_FOUND).json({ success: false, message: 'Item not found in order' });
      }

      const userId = orders.userId

      const { itemTotal, variantId, quantity, size, status, paymentStatus } = orders.items[itemIndex];

      if (status === 'order placed' || status === 'pending') {
         await orderCollection.findOneAndUpdate(
            { _id: orderId, 'items._id': itemId },
            { $set: { 'items.$.status': 'canceled' } },
            { new: true }
         )
      } else {
         return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: 'sorry, please make sure your product is not delivered' })
      }


      //Update Size Quantity
      await variantCollection.updateOne(
         { _id: variantId, 'sizes.size': size },
         { $inc: { 'sizes.$.stock': quantity } }
      );

      if ((orders.paymentMethod === 'RAZORPAY' || orders.paymentMethod === 'WALLET') && paymentStatus === 'paid') {


         const wallet = await walletCollection.findOne({ userId: userId })

         // if user dont have wallet create a new one
         if (!wallet) {
            await walletCollection.create({
               userId: userId,
               balance: itemTotal,
               history: [{ amount: itemTotal, status: 'credit', description: `Credited ${itemTotal} for canceled order` }]
            });
         } else {
            // Update the existing wallet
            await walletCollection.updateOne(
               { userId: userId },
               {
                  $inc: { balance: itemTotal }, // Increment the wallet balance
                  $push: {
                     history: { amount: itemTotal, status: 'credit', description: `Credited ${itemTotal} for canceled order` }
                  }
               }
            );
         }
      }

      return res.json({ success: true, message: 'order cancel successfully' })
   } catch (error) {
      next(error)
   }
}

exports.orderDelivered = async (req, res, next) => {
   try {
      const { orderId, itemId } = req.body

      const orderDelivered = await orderCollection.findOneAndUpdate(
         { _id: orderId, 'items._id': itemId },
         { $set: { 'items.$.status': 'delivered' } },
         { new: true }
      )
      console.log('updated order', orderDelivered)
      if (!orderDelivered) {
         return res.json({ success: false, message: 'something went wrong' })
      }
      return res.json({ success: true, message: 'order delivered successfully' })

   } catch (error) {
      next(error)
   }
}


exports.returnApprovel = async (req, res, next) => {
   try {
      const { orderId, itemId, status } = req.body

      //rejected the return request
      if (status === 'return rejected') {
         await orderCollection.findOneAndUpdate(
            { _id: orderId, 'items._id': itemId },
            { $set: { 'items.$.status': status } },
            { new: true }
         )
         return res.json({ success: true, message: 'return rejected' })
      }

      const orders = await orderCollection.findOne({ _id: orderId })

      const itemIndex = orders.items.findIndex(item => item._id.toString() === itemId);
      if (itemIndex === -1) {
         return res.json({ success: false, message: 'Item not found in order' });
      }


      const { itemTotal, variantId, quantity, size } = orders.items[itemIndex]
      const userId = orders.userId

      //incriment the stock
      const variant = await variantCollection.findOne({ _id: variantId });
      if (!variant) {
         return res.status(HttpStatusCode.NOT_FOUND).json({ success: false, message: 'Variant not found' });
      }

      //Update Size Quantity
      await variantCollection.updateOne(
         { _id: variantId, 'sizes.size': size },
         { $inc: { 'sizes.$.stock': quantity } }
      );


      const wallet = await walletCollection.findOne({ userId: userId })  //user wallet

      // if user dont have wallet create a new one
      if (!wallet) {
         await walletCollection.create({
            userId: userId,
            balance: itemTotal,
            history: [{ amount: itemTotal, status: 'credit', description: `Credited ${itemTotal} for return order` }]
         });
      } else {
         // Update the existing wallet
         await walletCollection.updateOne(
            { userId: userId },
            {
               $inc: { balance: itemTotal }, // Increment the wallet balance
               $push: {
                  history: { amount: itemTotal, status: 'credit', description: `Credited ${itemTotal} for return order` }
               }
            }
         );
      }

      //update status
      await orderCollection.findOneAndUpdate(
         { _id: orderId, 'items._id': itemId },
         { $set: { 'items.$.status': status } },
         { new: true }
      )

      return res.json({ success: true, message: 'order approved successfull and the amout credited to the users wallet' })

   } catch (error) {
      next(error)
   }
}

//order managment end


exports.adminLogout = (req, res) => {
   req.session.destroy((err) => {
      if (err) console.err(err)
      else res.redirect('/admin')
   })
}

