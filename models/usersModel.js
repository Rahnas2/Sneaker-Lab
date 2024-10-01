const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,

    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phone:{   
        type:String,
        required:false
        
    },  
    password:{   
        type:String,
        required:false
    
    },
    profile:{
        type:String
    },  
    googleId:{
        type:String,
        unique:true,  
        sparse:true
    },  
    isBlock:{
        type:Boolean,
        default:false 
    },
    referralCode:{
        type:String
    },
    isAdmin:{ 
        type:Boolean,
        default:false
    }
},{timestamps:true})

module.exports = mongoose.model('users',userSchema)