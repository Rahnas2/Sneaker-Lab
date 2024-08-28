
const adminAuth = (req,res,next)=>{
    if(req.session.admin){
        console.log('admin authenicated')
     return next()
    }else{
        res.redirect('/admin')
        console.log('admin not authenicated')
    }
}    

module.exports = adminAuth  