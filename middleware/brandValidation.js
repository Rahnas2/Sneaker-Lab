const { body } = require('express-validator')

const brandValidation = [

    body('brandName')
    .trim()
    .notEmpty().withMessage('please enter the brand name!')
    .matches(/[a-zA-Z]/).withMessage('Brand Name must contain at least one alphabet'),

    body('brandDescription')
    .trim()
    .isLength({min:4}).withMessage('description should have atlest 4 charactors')
]

module.exports = brandValidation