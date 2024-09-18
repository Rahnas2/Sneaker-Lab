
const {body} = require('express-validator')

const couponValidation = [
    body('code')
    .trim()
    .notEmpty().withMessage('plese fill this field'),

    body('discountPercentage')
    .trim()
    .isInt({min:1,max:100}).withMessage('invlaid'),

    body('maxAmount')
    .trim()
    .isInt({min:1}).withMessage('invalid'),

    body('minimumSpend')
    .trim()
    .isInt({min:1}).withMessage('invalid'),

    // body('startDate')
    // .trim()
    // .notEmpty().withMessage('please select the starting date'),

    body('endDate')
    .trim()
    .notEmpty().withMessage('plese select the ending date')
    // .custom((endDate, { req }) => {
    //     const startDate = req.body.startDate;
    //     if (new Date(endDate) < new Date(startDate)) {
    //       throw new Error('End date shuld be greater than start date');
    //     }
    //     return true;
    //   })
    
]

module.exports = couponValidation