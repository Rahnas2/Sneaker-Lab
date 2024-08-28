
const userAuth = (req,res,next)=>{
    if(req.session.user){
        console.log('user Authenticated')
        next()
    }else{
       return res.json({userNotAuthenticated:true,message:'you cannot access this page please login. <a href="/login" class="fw-bold">Login here</a>'})  
    }     
}

module.exports = userAuth       