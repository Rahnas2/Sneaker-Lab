const { body } = require('express-validator');
const usersCollection = require('../models/usersModel');

const editProfileValidation = async (req, res, next) => {
  const user = await usersCollection.findOne({ _id: req.session.user });
  console.log('user ', user.phone)
  
  const validations = [
    body('username')
      .trim()
      .isLength({ min: 5 }).withMessage('Username must be at least 5 characters')
      .matches(/[a-zA-Z]/).withMessage('Username must contain at least one alphabet'),

    body('email')
      .trim()
      .isEmail().withMessage('Email is required and must be valid'),

    body('phone')  
      .custom((value,{req}) =>{
        // if(user.googleId && value){
        //   if (!/^\d{10}$/.test(value)) {
        //     throw new Error('Please enter a valid 10-digit mobile number');
        //   }
        // }else if(!user.googleId){
        //   if (!/^\d{10}$/.test(value)) {
        //     throw new Error('Please enter a valid 10-digit mobile number');
        //   }
        // }
        if(value || user.phone !== undefined){ 
          if (!/^\d{10}$/.test(Number(value))) {
            throw new Error('Invalid Phone Number');
          }
        }
        return true
      })
  ];

  await Promise.all(validations.map(validation => validation.run(req)));
  next();
};

module.exports = editProfileValidation;