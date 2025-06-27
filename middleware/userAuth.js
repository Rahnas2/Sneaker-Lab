const usersCollection = require('../models/usersModel')
const userAuth = async (req, res, next) => {
    if (req.session.user) {

        const user = await usersCollection.findById(req.session.user)
        if (user && user.isBlock) {
            req.session.user = undefined
            return res.redirect('/login')
        }

        console.log('user Authenticated')
        next()
    } else {
        return res.json({ userNotAuthenticated: true, message: 'you cannot access this page please login. <a href="/login" class="fw-bold text-primary">Login here</a>' })
    }
}

module.exports = userAuth       