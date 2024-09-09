const {body} = require('express-validator')

const variantValid = [
    body('variants.*.color')
    .notEmpty().withMessage('color is required!'),
    

    body('variants.*.price')
    .trim()
    .notEmpty().withMessage('price is required!')
    .isFloat({min:1}).withMessage('price should be positive'),

    body('sizes.*.size')
    .notEmpty().withMessage('size is required'),

    body('sizes.*.stock')
    .notEmpty().withMessage('stock is required')
    .isInt({min:1}).withMessage('stock should be positive'),
]

module.exports = variantValid