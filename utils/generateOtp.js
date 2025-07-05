const crypto = require('crypto')
exports.generateOtp = ()=>{
    return crypto.randomInt(1000,9999)
}