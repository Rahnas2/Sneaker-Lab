const express = require('express')
const router = express.Router()
const admin_controller = require('../controllers/admin_controller')
const coupon_controller = require('../controllers/coupon_controller')
const offer_controller = require('../controllers/offer_controller')
const sales_controller = require('../controllers/sales_controller')
const dashboard_controller = require('../controllers/dashboard_controller')
const auth = require('../middleware/adminAuth')
const upload = require('../config/multerConfig')

const provalidation = require('../middleware/productValidation')
const catogoryValid = require('../middleware/categoryValidation')
const brandValid = require('../middleware/brandValidation')
const couponValid = require('../middleware/couponValidation')

router.get('/',admin_controller.adminLogin)
router.post('/login',admin_controller.adminLoginPost)

router.get('/dashBoard',auth,dashboard_controller.dashBoard)


//user managment start 
router.get('/userManagment',auth,admin_controller.userManagment)
router.post('/userManagment/block/:userId',auth,admin_controller.blockUser)
router.post('/userManagment/unblock/:userId',auth,admin_controller.unblockUser)
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
router.get('/addProduct',auth,admin_controller.getaddProduct)
router.post('/addProduct',upload.any(),provalidation,admin_controller.postaddproduct)  
router.post('/softDeleteProduct/:id',auth,admin_controller.softDeleteProduct)    
router.get('/editProduct/:id',upload.any(),auth,admin_controller.getEditProduct)
router.post('/editProduct/:id',upload.any(),auth,provalidation,admin_controller.postUpdatedProduct) 
//product managment end

//order managment start
router.get('/orderManagment',auth,admin_controller.loadOrderManagment)
router.post('/cancelProductAdmin',auth,admin_controller.cancelProductAdm)
router.post('/orderDelivered',auth,admin_controller.orderDelivered)
router.put('/returnApprovel',auth,admin_controller.returnApprovel)
//order managment end

//coupan managment start
router.get('/couponManagment',auth,coupon_controller.couponManagment)
router.post('/addCoupon',auth,couponValid,coupon_controller.addCoupon)
router.put('/editCoupon/:id',auth,couponValid,coupon_controller.editCoupon)
router.delete('/couponDelete/:id',auth,coupon_controller.couponDelete)
//coupan managment end

//offer maangement start
router.get('/offerManagment',auth,offer_controller.loadOfferManagment)
router.post('/offerManagment/addProductOffer',auth,offer_controller.addProductOffer)
router.post('/offerManagment/addCategoryOffer',auth,offer_controller.addCategoryOffer)
router.delete('/deleteProductOffer/:id',auth,offer_controller.removeProductOffer)
router.delete('/deleteCategoryOffer/:id',auth,offer_controller.removeCategoryOffer)
//offer managemant end


//sales report start
router.get('/salesManagment',auth,sales_controller.salesManagment)
router.get('/salesReportDownload',auth,sales_controller.downloadSalesReport)
//sales report end


router.get('/logout',admin_controller.adminLogout) 

module.exports = router