
const categoryCollection = require('../models/categoryModel')
const brandCollection = require('../models/brandModel')
const productCollection = require('../models/productModel')
const cartCollection = require('../models/cartModel')
const HttpStatusCode = require('../utils/statsCode')


exports.getShop = async (req, res) => {
    try {
        const categories = await categoryCollection.find({ deleted: false })
        const brands = await brandCollection.find({ deleted: false })

        const userId = req.session.user          //users id

        const filter = req.query.filter          //filter type

        const search = req.query.search || ''    //search

        //for pagination
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const skip = (page - 1) * limit

        //category filtering start
        const selectedCategory = req.query.category || ''
        let categoryFilter = {}
        if (selectedCategory) {
            const findCategory = await categoryCollection.findOne({ categoryName: selectedCategory, deleted: false })
            if (findCategory) {
                const selectedCategoryId = findCategory._id
                categoryFilter = { category: selectedCategoryId }
            }
        }
        //category filtering end

        //brand filtering start
        const selectedBrand = req.query.brand || ''
        let brandFilter = {}
        if (selectedBrand) {
            const findBrand = await brandCollection.findOne({ brandName: selectedBrand, deleted: false })
            if (findBrand) {
                const selectedBrandId = findBrand._id
                brandFilter = { brand: selectedBrandId }
            }
        }
        //brand filtering end

        let sortOption = {};


        switch (filter) {
            case 'price-low-high':
                sortOption = { minPrice: 1 };
                break;
            case 'price-high-low':
                sortOption = { minPrice: -1 };
                break;
            case 'new-arrivals':
                sortOption = { createdAt: -1 };
                break;
            case 'a-z':
                sortOption = { productName: 1 };
                break;
            case 'z-a':
                sortOption = { productName: -1 };
                break;
            default:
                sortOption = null;
        }

        const aggregationPipeline = [
            { $match: { deleted: false, ...categoryFilter, ...brandFilter } },
            {
                $lookup: {
                    from: 'variants',
                    localField: 'variants',
                    foreignField: '_id',
                    as: 'variants'
                }
            },
            {
                $addFields: {
                    minPrice: { $min: '$variants.price' }
                }
            }
        ];

        if (search) {
            aggregationPipeline.unshift({
                $match: {
                    productName: { $regex: search, $options: 'i' } // Case-insensitive search
                }
            });
        }

        if (sortOption) {
            aggregationPipeline.push({ $sort: sortOption });
        }


        const allProducts = await productCollection.aggregate(aggregationPipeline)
        const totalProducts = allProducts.length

        const products = await productCollection.aggregate(aggregationPipeline).skip(skip).limit(limit)

        const totalPages = Math.ceil(totalProducts / limit)

        let productsInCart = {}
        for (let product of products) {
            let productId = product._id
            const cart = await cartCollection.findOne({ userId, 'items.product': productId })

            productsInCart[productId] = cart ? true : false
        }

        //average rating
        let averageRating = {}
        products.forEach((product, index) => {
            let rating = 0
            product.review.forEach(review => {
                rating += review.rating
            })
            const avg = rating / product.review.length
            averageRating[product._id] = Math.ceil(avg)
        })


        res.render('User/shop', {
            user: req.session.user,
            page: 'shop',
            categories,
            brands,
            products,
            productsInCart,
            filter,
            search,
            selectedCategory,
            selectedBrand,
            totalPages,
            page,
            limit,
            averageRating
            // selectedCategory
        })

    } catch (error) {
        console.log('error', error)
    }
}

exports.getProducts = async (req, res) => {
    try {
        const userId = req.session.user
        const { category, brand, filter, search, page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit;
        let categoryFilter = {}, brandFilter = {};

        if (category) {
            const cat = await categoryCollection.findOne({ categoryName: category });
            if (cat) categoryFilter = { category: cat._id };
        }

        if (brand) {
            const br = await brandCollection.findOne({ brandName: brand });
            if (br) brandFilter = { brand: br._id };
        }

        let sortOption = {};
        switch (filter) {
            case 'price-low-high': sortOption = { minPrice: 1 }; break;
            case 'price-high-low': sortOption = { minPrice: -1 }; break;
            case 'new-arrivals': sortOption = { createdAt: -1 }; break;
            case 'a-z': sortOption = { productName: 1 }; break;
            case 'z-a': sortOption = { productName: -1 }; break;
        }

        const aggregationPipeline = [
            { $match: { deleted: false, ...categoryFilter, ...brandFilter } },
            {
                $lookup: {
                    from: 'variants',
                    localField: 'variants',
                    foreignField: '_id',
                    as: 'variants'
                }
            },
            { $addFields: { minPrice: { $min: '$variants.price' } } }
        ];

        if (search) aggregationPipeline.unshift({ $match: { productName: { $regex: search, $options: 'i' } } });
        if (filter) aggregationPipeline.push({ $sort: sortOption });

        const totalProducts = (await productCollection.aggregate(aggregationPipeline)).length;
        const products = await productCollection.aggregate(aggregationPipeline).skip(parseInt(skip)).limit(parseInt(limit));

        let productsInCart = {}
        for (let product of products) {
            let productId = product._id
            const cart = await cartCollection.findOne({ userId, 'items.product': productId })

            productsInCart[productId] = cart ? true : false
        }

        // Average Ratings 
        let averageRating = {}
        products.forEach((product, index) => {
            let rating = 0
            product.review.forEach(review => {
                rating += review.rating
            })
            const avg = rating / product.review.length
            averageRating[product._id] = Math.ceil(avg)
        })


        res.json({ products, totalProducts, productsInCart, averageRating });

    } catch (err) {
        console.error(err);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: 'Server error' });
    }
}

//=========shope page end=========// 

//=========view product start=========// 
exports.getViewProduct = async (req, res) => {
    try {
        const productId = req.params.id   //product id

        const userId = req.session.user   //users id

        const product = await productCollection.findOne({ _id: productId }).populate('variants')   //product details

        const categoryId = product.category
        const brandId = product.brand

        const category = await categoryCollection.findById(categoryId)
        const brand = await brandCollection.findById(brandId)

        const jsObjProduct = product.toObject()   //convert mongoose object to plain js object to edit to chnage the category and  brand id to their name
        jsObjProduct.category = category.categoryName
        jsObjProduct.brand = brand.brandName

        const cart = await cartCollection.findOne({ userId: userId, 'items.product': productId })
        const productInCart = cart ? true : false

        const review = product.review

        const totalStars = review.reduce((acc, curr) => acc += curr.rating, 0)

        const avgRating = Math.ceil(totalStars / review.length)

        res.render('User/viewProduct', {
            user: req.session.user,
            page: 'shope',
            product: jsObjProduct,
            productInCart,
            review,
            avgRating
        })
    } catch (error) {
        console.log('error', error)
    }

}
