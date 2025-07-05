
const wishlistCollection = require('../models/wishlistModel')

const cartCollection = require('../models/cartModel');
const HttpStatusCode = require('../utils/statsCode');

exports.getWishlist = async (req,res, next) =>{
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

        let productsInCart = {}
        let averageRating = {}
        if(wishlist){
            for(let product of wishlist.productId){
               let productId = product._id
    
               const cart = await cartCollection.findOne({userId:user,'items.product':productId})
    
               productsInCart[productId] = cart ? true : false

               let totalStars = product.review.reduce((acc,curr) => acc += curr.rating, 0)
               let avg = Math.ceil(totalStars / product.review.length)
               
               averageRating[productId] = avg
            }
        }
        
        res.render('User/wishlist',{
            user,
            page:null,
            wishlist: wishlist ? wishlist : null,
            productsInCart,
            averageRating
            
        })
    } catch (error) {
        next(error)
    }
}

exports.postWishlist = async (req,res, next) =>{
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
            return res.state(HttpStatusCode.BAD_REQUEST).json({success:false,message:'sorry, your wishlist is full'})
        }

        if(!wishlist.productId.includes(productId)){
            wishlist.productId.push(productId)
            await wishlist.save()
            return res.json({success:true,message:'Added Successfully'})
        }else{
            return res.state(HttpStatusCode.CONFLICT).json({alreadyExist:true,message:'Already Exist'})
        }
    } catch (error) {
       next(error)
    }
}


exports.removeWishlist = async (req, res, next)=>{
    try {
        const userId = req.session.user
        const productId = req.params.id
        await wishlistCollection.updateOne(
            {userId:userId},
            { $pull: { productId: productId } }
        )
        return res.json({success:true,message:'successfully removed the product'})
    } catch (error) {
        next(error)
    }
}