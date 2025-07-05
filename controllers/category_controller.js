

const categoryCollection = require('../models/categoryModel')

//validation
const { validationResult } = require('express-validator')
const HttpStatusCode = require('../utils/statsCode')


exports.categoryManagment = async (req, res, next) => {
   try {
      const searchQuery = req.query.search || ''
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 10
      const skip = (page - 1) * limit

      const searchCriteria = {
         $or: [
            { categoryName: new RegExp(searchQuery, 'i') },
            { categoryDescription: new RegExp(searchQuery, 'i') }

         ]
      }

      const categoryList = await categoryCollection.find(searchCriteria).sort({ createdAt: -1 }).skip(skip).limit(limit)

      const totalCategorys = await categoryCollection.countDocuments({ deleted: false })
      const totalPages = Math.ceil(totalCategorys / limit)

      res.render('Admin/categoryManagment', {
         categoryList,
         currentPage: page,
         totalPages,
         limit,
         searchQuery
      })
   } catch (error) {
      next(error)
   }

}

exports.addCategory = async (req, res, next) => {
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

      const { categoryName, categoryDescription } = req.body

      const categoryExist = await categoryCollection.findOne({ categoryName: { $regex: new RegExp(`^${categoryName}$`, 'i') } })

      if (categoryExist) {
         return res.status(HttpStatusCode.CONFLICT).json({ success: false, error: 'category alredy exsist' })
      }

      const newCategory = new categoryCollection({
         categoryName,
         categoryDescription

      })

      await newCategory.save()

      return res.json({ success: true, message: 'category successfully added' })

   } catch (error) {
      next(error)
   }
}


exports.toggleCategoryStatus = async (req, res, next) => {
   try {
      const categoryId = req.params.id

      const catogory = await categoryCollection.findById(categoryId)
      const status = catogory.deleted

      await categoryCollection.findByIdAndUpdate(categoryId, { deleted: !status })

      const message = status ? 'Activated' : 'De-activated'

      return res.status(HttpStatusCode.OK).json({ success: true, message })
   } catch (error) {
      next(error)
   }
}
