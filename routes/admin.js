const express = require('express')
const router = express.Router()
const admin_controller = require('../controllers/admin_controller')
const auth = require('../middleware/adminAuth')
const upload = require('../config/multerConfig')

const provalidation = require('../middleware/productValidation')
const variantValid = require('../middleware/variantValidation')
const catogoryValid = require('../middleware/categoryValidation')
const brandValid = require('../middleware/brandValidation')

router.get('/',admin_controller.adminLogin)
router.post('/login',admin_controller.adminLoginPost)
router.get('/home',auth,admin_controller.home)

//user managment start 
router.get('/userManagment',auth,admin_controller.userManagment)
router.post('/userManagment/block/:userId',admin_controller.blockUser)
router.post('/userManagment/unblock/:userId',admin_controller.unblockUser)
//user managment end

//category managment start 
router.get('/categoryManagment',auth,admin_controller.categoryManagment) 
router.post('/addCategory',auth,catogoryValid,admin_controller.addCategory)
router.post('/deleteCategory/:id',auth,admin_controller.softDeleteCategory)  
//category managment end


//brand managment start 
router.get('/brandManagment',auth,admin_controller.brandManagment) 
router.post('/addBrand',auth,brandValid,admin_controller.addBrand)
router.post('/deleteBrand/:id',auth,admin_controller.softDeleteBrand)
//brand managment end


//product managment start
router.get('/productManagment',auth,admin_controller.productManagment)
router.get('/addProduct',admin_controller.getaddProduct)
router.post('/addProduct',upload.any(),provalidation,admin_controller.postaddproduct)  
router.post('/softDeleteProduct/:id',auth,admin_controller.softDeleteProduct)    
router.get('/editProduct/:id',upload.array('images'),admin_controller.getEditProduct)
router.post('/editProduct/:id',upload.any(),provalidation,admin_controller.postUpdatedProduct) 
//product managment end

//order managment start
router.get('/orderManagment',auth,admin_controller.loadOrderManagment)
router.post('/cancelProductAdmin',auth,admin_controller.cancelProductAdm)
//order managment end


router.get('/logout',admin_controller.adminLogout) 

module.exports = router