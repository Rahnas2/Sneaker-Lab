const { body } = require('express-validator')

const categoryValidation = [

    body('categoryName')
    .trim()
    .notEmpty().withMessage('please enter the category name!')
    .matches(/[a-zA-Z]/).withMessage('Category Name must contain at least one alphabet'),

    body('categoryDescription')
    .trim()
    .isLength({min:4}).withMessage('description should have atlest 4 charactors')
]

module.exports = categoryValidation