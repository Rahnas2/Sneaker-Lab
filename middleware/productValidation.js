const { body } = require('express-validator')

const proValidation = [
    //validate product name
    body('productName')
    .trim()
    .isLength({min:5, max:25}).withMessage('product name should be between 5 and 25!'),

    //validate category
    body('category')
    .isString().withMessage('category should be string!')
    .isLength({min:4}).withMessage('category should atleast 4 characters!'),

    //brand validate
    body('brand')
    .isLength({min:2}).withMessage('brand must have atlest 2 characters'),

    //variants array validate(color, size, stock, price)
    body('variants.*.color')
    .trim()
    .notEmpty().withMessage('color is required!'),

    body('variants.*.size')
    .trim()
    .notEmpty().withMessage('size is required!'),

    body('variants.*.stock')
    .trim()
    .notEmpty().withMessage('stock is required!')
    .isInt({min:1}).withMessage('stock should be positive number!'),

    body('variants.*.price')
    .trim()
    .notEmpty().withMessage('price is required!')
    .isInt({min:1}).withMessage('price should be positive number!'),

    //validate images
    body('images')
    .notEmpty().withMessage('all images are required') 
]

module.exports = proValidation