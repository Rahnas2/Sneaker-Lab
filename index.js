const express = require('express')
const app = express()
const session = require('express-session')
require('dotenv').config()
const nocache = require('nocache')
const connect_db = require('./config/db')
const passport = require('./config/passport')
const adminroute = require('./routes/admin')
const userroute = require('./routes/users')
const PORT = process.env.PORT || 5050;

connect_db()

//for checing and updating the coupon status
require('./jobs/couponStatusUpdater')

//set view engine
app.set('view engine','ejs')
   
app.use(express.static('public'))
app.use(express.static('views'))

// Middleware to parse JSON bodies
app.use(express.json())
// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({extended: true}))

//session
app.use(session({
    secret: process.env.Session_Secret,
    resave: false,
    saveUninitialized: true
}))

//passport
app.use(passport.initialize())
app.use(passport.session())

app.use(nocache())

//Routes
app.use('/',userroute)
app.use('/admin',adminroute)

app.get('*', (req, res) =>{
    res.render('404')
})

//Error handling middleware
app.use((err, req, res, next) =>{
    console.error(err.stack);
    res.status(500).send('error')
})

app.listen(PORT,()=> console.log(`server is running on ${PORT}`))
