
const productCollection = require('../models/productModel')
const categoryCollection = require('../models/categoryModel')
const variantCollection = require('../models/variantModel')
const { deleteOne } = require('../models/cartModel')


exports.loadOfferManagment = async (req,res)=>{
    try {

        const type = req.query.type

        const searchQuery = req.query.search || ''
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 2
        const skip = (page-1)*limit

        const products = await productCollection.find({deleted:false}).populate('variants')
        const categories = await categoryCollection.find({deleted:false})
        
        const currTime = Date.now()

        const offerProductsList = []
        products.forEach(product => {
            if(product.offer.discountPercentage  && product.offer.expirAt){

                const status = new Date(product.offer.expirAt) < currTime ? false : true;

                offerProductsList.push({
                productId:product._id,
                productName: product.productName,
                image: product.variants[0].images[0] || 'No image available',
                discountPercentage: product.offer.discountPercentage,
                expirAt: product.offer.expirAt,
                status: status
            });
        }
        });
        const paginatedOfferProducts = offerProductsList.slice(skip, skip + limit)
        const totalOfferedProduct = offerProductsList.length
        const OfferProductTotalPage = Math.ceil(totalOfferedProduct/limit) 

        const offerCategoryList = []
        categories.forEach(category => {
            if(category.offer.discountPercentage && category.offer.expirAt){
                const status = new Date(category.offer.expirAt) < currTime ? false : true;

                offerCategoryList.push({
                categoryId:category._id,
                categoryName: category.categoryName,
                discountPercentage: category.offer.discountPercentage,
                expirAt: category.offer.expirAt,
                status: status
            }); 
            }
        });

        const paginatedOfferCategory = offerProductsList.slice(skip, skip + limit)
        const totalOfferedCategory = offerCategoryList.length 
        const OfferCategoryTotalPage = Math.ceil(totalOfferedCategory/limit)

        let productPage = 1
        if(type === 'product'){
            productPage = page
        }

        let categoryPage = 1
        if(type === 'category'){
            categoryPage = page
        }

        res.render('Admin/offerManagment',{
            products,
            categories,
            offerProductsList : paginatedOfferProducts,           //offered product list 
            OfferProductTotalPage,       //total pages for product offerlist
            productPage,                 //current page in the product offerlist
            offerCategoryList: paginatedOfferCategory,           //offered product list 
            OfferCategoryTotalPage,      //total pages for category offerlist
            categoryPage,                //curret page in the category offerlist
            limit
        })
    } catch (error) {
        console.error('something went wrong',error)
    }
}

exports.addProductOffer = async (req,res)=>{
    try {
        const {productId, discountPercentage, expirAt} = req.body
        const offerType = 'product'

        const product = await productCollection.findOne({_id:productId})
        if(!product){
           return res.json({success:false,message:'product not found!'})
        }

        if(product.deleted){
            return res.json({success:false,message:'sorry, the product is removed by admin!'})
        }

        const currTime = Date.now()
        if(new Date(expirAt) <= currTime){
            return res.json({success:false,message:'sorry,expiry time should be in the future!'})
        }

        // if(product.offer.discountPercentage){
        //     return res.json({success:false,message:'soryy, a offer is there in this product'})
        // }

        product.offer = {offerType, discountPercentage, expirAt}
        product.save()

        return res.json({success:true,message:'offer applied successfully'})

    } catch (error) {
        console.error('something went wrong',error)
    }
}

exports.addCategoryOffer = async (req,res)=>{
    try {
        const {categoryId, discountPercentage, expirAt} = req.body
        const offerType = 'category'

        const category = await categoryCollection.findOne({_id:categoryId})

        const products = await productCollection.find({category:categoryId})

        if(!category){
           return res.json({success:false,message:'category not found!'})
        }

        if(category.deleted){
            return res.json({success:false,message:'sorry, the category is removed by admin!'})
        }

        const currTime = Date.now()
        if(new Date(expirAt) <= currTime){
            return res.json({success:false,message:'sorry,expiry time should be in the future!'})
        }

        // if(category.offer.discountPercentage){
        //     return res.json({success:false,message:'soryy, a offer is there in this category'})
        // }

        category.offer = {discountPercentage, expirAt}
        category.save()

        products.forEach(async (product) => {
            product.offer = {offerType, discountPercentage, expirAt}
            await product.save()
        });

        return res.json({success:true,message:'category offer added successfully'})

    } catch (error) {
        console.error('something went wrong',error)
    }
}


exports.removeProductOffer = async (req,res) =>{

    const productId = req.params.id

        await productCollection.updateOne(
            {_id:productId},
            {$unset:{offer: ''}}
        )

    return res.json({success:true,message:'successfully deleted the offer'})
   
}

exports.removeCategoryOffer = async (req,res) =>{

    const categoryId = req.params.id

    const products = await productCollection.find({category:categoryId})

    //remove the offer feild from category schema
    await categoryCollection.updateOne(
        {_id:categoryId},
        {$unset:{offer: ''}}
    )

    //remove the category offer from product schema
    products.forEach(async product => {
        if(product.offer && product.offer.offerType === 'category'){
            let productId = product._id 
            await productCollection.updateOne(
                {_id:productId},
                {$unset:{offer: ''}}
            )
        }
    });

    return res.json({success:true,message:'successfully deleted the offer'})

}