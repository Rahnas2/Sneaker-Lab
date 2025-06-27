const { body } = require('express-validator');
const usersCollection = require('../models/usersModel');

const editProfileValidation = async (req, res, next) => {
  const user = await usersCollection.findOne({ _id: req.session.user });

  const validations = [
    body('username')
      .trim()
      .isLength({ min: 5 }).withMessage('Username must be at least 5 characters'),

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
        if(user.phone){
          if (!/^\d{10}$/.test(value)) {
            throw new Error('Please enter a valid 10-digit mobile number');
          }
        }
        return true
      })
  ];

  await Promise.all(validations.map(validation => validation.run(req)));
  next();
};

module.exports = editProfileValidation;