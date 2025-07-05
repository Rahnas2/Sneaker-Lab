const crypto = require('crypto')

exports.generateReferralCode = () => {
    return crypto.randomInt(10000, 99999)
}
