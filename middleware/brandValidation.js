const { body } = require('express-validator')

const brandValidation = [

    body('brandName')
    .trim()
    .notEmpty().withMessage('please enter the brand name!'),

    body('brandDescription')
    .trim()
    .isLength({min:4}).withMessage('description should have atlest 4 charactors')
]

module.exports = brandValidation