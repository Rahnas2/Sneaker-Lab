const { body } = require('express-validator')

exports.formValidation = [
    body('email').isEmail().withMessage('email is required'),
    body('password').trim().isLength({ min: 4 }).withMessage('password is required')
]

exports.signupValidation = [
    body('username')
        .trim()
        .isLength({ min: 5 }).withMessage('username must be aleast 5 characters')
        .matches(/[a-zA-Z]/).withMessage('Username must contain at least one alphabet'),

    body('email')
        .trim()
        .isEmail().withMessage('email is required'),

    body('phone')
        .trim()
        .isLength({ min: 10, max: 10 }).withMessage('please enter valid mobile number')
        .custom(value => {
            if (!/^\d{10}$/.test(Number(value))) {
                throw new Error('Invalid Phone Number');
            }
            return true
        }),

    body('password').trim().isLength({ min: 8 }).withMessage('password must have atleast eight charcter'),

    body('cfpassword').trim().isLength({ min: 8 }).withMessage('password is not match')
]

