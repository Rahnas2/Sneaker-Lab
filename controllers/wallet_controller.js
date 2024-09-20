
const walletCollection = require('../models/walletModel')

exports.getWallet = async (req,res) => {
    try {
        const user = req.session.user
        const wallet = await walletCollection.findOne({userId:user})
        res.render('User/wallet',{
            user,
            page:null,
            wallet
        })
    } catch (error) {
        console.error('something went wrong',error)
    }
}