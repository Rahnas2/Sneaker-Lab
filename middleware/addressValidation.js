
const {body} = require('express-validator')

const addressValidation = [
    body('fullName')
    .trim()
    .notEmpty().withMessage('required'),

    body('country')
    .trim()
    .notEmpty().withMessage('required'),

    body('localAddress')
    .trim()
    .notEmpty().withMessage('required'),

    body('city')
    .trim()
    .notEmpty().withMessage('required'),

    body('state')
    .trim()
    .notEmpty().withMessage('required'),

    body('pincode')
    .trim()
    .isLength({min:6,max:6}).withMessage('invalid'),

    body('mobile')
    .trim()
    .isLength({min:10,max:10}).withMessage('invalid mobile number'),

    body('email')
    .trim(),
]

module.exports = addressValidation