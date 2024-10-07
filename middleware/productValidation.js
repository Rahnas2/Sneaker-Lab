const { body } = require('express-validator')


const proValidation = [
    //validate product name
    body('productName')
    .trim()
    .isLength({min:5, max:30}).withMessage('product name should be between 5 and 30!'),

    //validate category
    body('category')
    .notEmpty().withMessage('plese select the category'),
    

    body('brand')
    .notEmpty().withMessage('please select brand'),

    body('description')
    .notEmpty().withMessage('description is required!'),

    body('variants.*.color')
    .notEmpty().withMessage('color is required!')
    .custom((value) => {
        if(value === 'null'){
            throw new Error('plese select a valid color')
        }
        return true
    }),
    
    body('variants.*.price')
    .trim()
    .notEmpty().withMessage('price is required!')
    .isFloat({min:0}).withMessage('price should be positive'),

    body('variants.*.sizes.*.size')
    .isInt({min:1}).withMessage('invalid'),

    body('variants.*.sizes.*.stock')
    .isInt({min:1}).withMessage('invalid'),
    
    body('description')
    .trim()
    .notEmpty().withMessage('discription is required')
      
]

module.exports = proValidation