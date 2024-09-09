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

    //brand validate 
    // body('brand')
    // .notEmpty().withMessage('brand is required')
    // .custom((value)=>{
    //     if(value == null){
    //         throw new Error('please select valid brand')
    //     }
    //     return true
    // }),

    // variants array validate(color, size, stock, price)
    // body('variants.*.color')
    // .notEmpty().withMessage('color is required!'),
    

    // body('variants.*.price')
    // .trim()
    // .notEmpty().withMessage('price is required!')
    // .isFloat({min:1}).withMessage('price should be positive'),

    // body('sizes.*.size')
    // .notEmpty().withMessage('size is required'),

    // body('sizes.*.stock')
    // .notEmpty().withMessage('stock is required')
    // .isInt({min:1}).withMessage('stock should be positive'),
    
      
]

module.exports = proValidation