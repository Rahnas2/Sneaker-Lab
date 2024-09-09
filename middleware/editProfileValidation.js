const {body} = require('express-validator')

const editProfileValidation = [
    body('username')
    .trim()
    .isLength({min:5}).withMessage('username must be aleast 5 characters')
    .isAlphanumeric().withMessage('Username must be alphanumeric'),

    body('email')
    .trim()
    .isEmail().withMessage('email is required'),

    body('phone')
    .trim()
    .isLength({min:10,max:10}).withMessage('please enter valid mobile number')
    .isNumeric().withMessage('please enter valid mobile number')
]

module.exports = editProfileValidation