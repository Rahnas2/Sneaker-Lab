
const { body } = require('express-validator')

const addressValidation = [
    body('fullName')
        .trim()
        .notEmpty().withMessage('required')
        .matches(/^[a-zA-Z\s]+$/).withMessage('Full name can contain only letters and spaces'),

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
        .isLength({ min: 6, max: 6 }).withMessage('invalid')
        .isInt({ min: 0 }).withMessage('invalid'),

    body('mobile')
        .trim()
        .notEmpty().withMessage('Mobile number is required')
        .custom(value => {
            if (!/^\d{10}$/.test(value)) {
                throw new Error('Invalid Phone Number');
            }
            if (/^(\d)\1{9}$/.test(value)) {
                throw new Error('Invalid Phone Number');
            }
            return true;
        }),

    body('email')
        .trim(),
]

module.exports = addressValidation