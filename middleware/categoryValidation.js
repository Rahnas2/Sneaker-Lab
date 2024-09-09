const { body } = require('express-validator')

const categoryValidation = [

    body('categoryName')
    .trim()
    .notEmpty().withMessage('please enter the category name!'),

    body('categoryDescription')
    .trim()
    .isLength({min:4}).withMessage('description should have atlest 4 charactors')
]

module.exports = categoryValidation