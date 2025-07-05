const transporter = require('../config/email')
const otpCollection = require('../models/otpModel')


const otpExpiryTime = 30 * 1000
exports.sendOtp = async (email,otp)=>{
    const otpData = {
        email:email,
        otp:otp,
        // createdAt:new Date(),
        expiresAt:new Date(Date.now() + otpExpiryTime)
    }
    const mailOptions ={
        from:process.env.EMAIL_USER,
        to:email,
        subject:'your otp code',
        text: `your otp is ${otp}`

    }
    try{
        await transporter.sendMail(mailOptions)
        console.log('otp send')
        await otpCollection.create(otpData)
    }catch (error){
        console.error('error sending otp',error)
    }
    
}