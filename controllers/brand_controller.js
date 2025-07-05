
const brandCollection = require('../models/brandModel')

//validation
const { validationResult } = require('express-validator')
const HttpStatusCode = require('../utils/statsCode')

//brand managment start
exports.brandManagment = async (req, res, next) => {
   try {
      const searchQuery = req.query.search || ''
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 10
      const skip = (page - 1) * limit

      const searchCriteria = {
         $or: [
            { brandName: new RegExp(searchQuery, 'i') },
            { brandDescription: new RegExp(searchQuery, 'i') }

         ]
      }

      const brandList = await brandCollection.find(searchCriteria).sort({ createdAt: -1 }).skip(skip).limit(limit)

      const totalBrands = await brandCollection.countDocuments({ deleted: false })
      const totalPages = Math.ceil(totalBrands / limit)

      res.render('Admin/brandManagment', {
         brandList,
         currentPage: page,
         totalPages,
         limit,
         searchQuery
      })
   } catch (error) {
      next(error)
   }

}

exports.addBrand = async (req, res, next) => {
   try {

      //validation
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
         const validationErrors = errors.array().reduce((acc, error) => {
            acc[error.path] = error.msg
            return acc
         }, {})
         console.log('validation error', validationErrors)
         return res.status(HttpStatusCode.BAD_REQUEST).json({ validationError: true, validationErrors })
      }

      const { brandName, brandDescription } = req.body

      const brandExist = await brandCollection.findOne({ brandName: { $regex: new RegExp(`^${brandName}$`, 'i') } })

      if (brandExist) {
         return res.status(HttpStatusCode.CONFLICT).json({ success: false, error: 'brand already exist' })
      }

      const newBrand = new brandCollection({
         brandName,
         brandDescription
      })

      await newBrand.save()

      return res.status(HttpStatusCode.CREATED).json({ success: true, message: 'brand added successfull' })

   } catch (error) {
      next(error)
   }
}


exports.toggleBrandStatus = async (req, res, next) => {
   try {
      const brandId = req.params.id
      const brand = await brandCollection.findById(brandId)
      const status = brand.deleted

      await brandCollection.findByIdAndUpdate(brandId, { deleted: !status })

      const message = status ? 'Activated' : 'De-activated'
      return res.status(HttpStatusCode.OK).json({ success: true, message })
   } catch (error) {
      next(error)
   }

}
