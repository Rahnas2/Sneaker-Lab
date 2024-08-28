const passport = require('passport')
const googleStrategy = require('passport-google-oauth20').Strategy
const usersCollection = require('../models/usersModel')
const dotenv = require('dotenv').config()

passport.use(new googleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:'/auth/google/callback'
},

async (accessToken,refreshToken,profile,done)=>{
    try {
        let user = await usersCollection.findOne({googleId:profile.id})
        if(user){
            return done(null,user)
        }else{
            user = new usersCollection({
                username:profile.displayName,
                email:profile.emails[0].value,
                googleId:profile.id
            })
            await user.save()
            return  done(null,user)
        }
    } catch (error) {
        
        return done(error,null)

    }
}

))

passport.serializeUser((user,done)=>{
    done(null,user.id)
})

passport.deserializeUser((id,done)=>{
    usersCollection.findById(id)
    .then(user=>{
        done(null,user)
    })
    .catch(err =>{
        done(err,null)
    })
})

module.exports = passport