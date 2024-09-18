
const wishlistCollection = require('../models/wishlistModel')

exports.getWishlist = async (req,res) =>{
    try {
        const user = req.session.user
        const wishlist = await wishlistCollection
        .findOne({ userId:user })
        .populate({
          path: 'productId', // Populating the productId field
          populate: {
            path: 'variants', // Nested population for variants (if variants are referenced documents)
          }
        });

        res.render('User/wishlist',{
            user,
            page:null,
            wishlist,
            
        })
    } catch (error) {
        console.error('something went wrong',error)
    }
}

exports.postWishlist = async (req,res) =>{
    try {
        const productId = req.params.id
        const userId = req.session.user
        const wishlist = await wishlistCollection.findOne({userId})
        console.log('wishlist',wishlist)
        if(!wishlist){
            await wishlistCollection.create({userId,productId:[productId]})
            return res.json({success:true,message:'Added Successfully'})
        }
        if(wishlist.productId.length > 10){
            return res.json({success:false,message:'sorry, your wishlist is full'})
        }
        if(!wishlist.productId.includes(productId)){
            wishlist.productId.push(productId)
            await wishlist.save()
            return res.json({success:true,message:'Added Successfully'})
        }else{
            return res.json({alreadyExist:true,message:'Already Exist'})
        }
    } catch (error) {
       console.error('something went wrong',error) 
    }
}


exports.removeWishlist = async (req,res)=>{
    try {
        const userId = req.session.user
        const productId = req.params.id
        await wishlistCollection.updateOne(
            {userId:userId},
            { $pull: { productId: productId } }
        )
        return res.json({success:true,message:'successfully removed the product'})
    } catch (error) {
        console.error('something went wrong',error)
        return res.status(500).json({ success: false, message: 'Failed to remove product' });
    }
}