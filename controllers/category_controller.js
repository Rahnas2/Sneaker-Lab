

const categoryCollection = require('../models/categoryModel')

//validation
const { validationResult } = require('express-validator')
const HttpStatusCode = require('../utils/statsCode')


exports.categoryManagment = async (req, res) => {

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
}

exports.addCategory = async (req, res) => {
   try {

      //validation
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
         const validationErrors = errors.array().reduce((acc, error) => {
            acc[error.path] = error.msg
            return acc
         }, {})
         console.log('validation error', validationErrors)
         return res.status(HttpStatusCode.CREATED).json({ validationError: true, validationErrors })
      }

      const { categoryName, categoryDescription } = req.body

      const categoryExist = await categoryCollection.findOne({ categoryName: { $regex: new RegExp(`^${categoryName}$`, 'i') } })

      if (categoryExist) {
         return res.json({ success: false, error: 'category alredy exsist' })
      }

      const newCategory = new categoryCollection({
         categoryName,
         categoryDescription

      })

      await newCategory.save()

      return res.json({ success: true, message: 'category successfully added' })

   } catch (error) {
      console.error('something went wrong', error)
   }
}


exports.toggleCategoryStatus = async (req, res) => {
   try {
      const categoryId = req.params.id

      const catogory = await categoryCollection.findById(categoryId)
      const status = catogory.deleted

      await categoryCollection.findByIdAndUpdate(categoryId, { deleted: !status })

      const message = status ? 'Activated' : 'De-activated'

      return res.status(HttpStatusCode.OK).json({ success: true, message })
   } catch (error) {
      console.error('error during soft delete', error)
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: 'faild category delete' })
   }
}

//category managment end 