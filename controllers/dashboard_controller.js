
const ordersCollection = require('../models/orderModel')
const { productManagment } = require('./admin_controller')


exports.dashBoard = async (req,res) =>{
    try {

        const { filterType } = req.query
        console.log('req.query',req.query)
        let filterStartDate;
        let filterEndDate;

        let chartFilter = {}
        const currDate = new Date()

        switch(filterType){
            case 'weekly':
                filterStartDate = new Date(currDate.setDate(currDate.getDate()- currDate.getDay()))
                filterStartDate.setHours(0, 0, 0, 0)

                filterEndDate = new Date(currDate.setDate(currDate.getDate()- currDate.getDay() + 7))
                filterEndDate.setHours(23, 59, 59, 999);
                console.log('week start date',filterStartDate)
                console.log('week end ',filterEndDate)
                
                const weeklyData = await ordersCollection.aggregate([
                    {
                     $unwind:'$items',
                    },
                    {
                        $match:{
                            createdAt: {$gt:filterStartDate, $lte: filterEndDate},
                            'items.paymentStatus': 'paid'
                        }
                    },
                    {
                        $group:{
                            _id:{$dayOfWeek: '$createdAt'},
                            totalOrders: { $sum: 1},
                            totalSales:{
                                $sum:{
                                    $multiply:['$items.price', '$items.quantity']
                                }
                            }
                        }
                    },
                    {
                        $sort: {
                            _id: 1
                        }
                    }
                ])
                
                let chartDataWeekly = new Array(7).fill(0)

                const weeklyLabels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

                weeklyData.forEach(data => {
                    chartDataWeekly[data._id -1] = data.totalSales
                })

                chartFilter = {
                    labels:weeklyLabels,
                    datasets:[
                        {
                            label: 'totalSales',
                            data: chartDataWeekly
                        }
                    ]
                }

                break
            case 'monthly':
                filterStartDate = new Date(currDate.getFullYear(), 0, 1);
                filterEndDate = new Date(currDate.getFullYear(), 11, 31, 23, 59, 59, 999);
                
                const monthlyData = await ordersCollection.aggregate([
                    {
                        $unwind:'$items'
                     },
                    {
                        $match:{
                            createdAt: {$gt: filterStartDate, $lte: filterEndDate},
                            'items.paymentStatus': 'paid'
                        }
                    },
                    {
                        $group:{
                            _id:{$month:'$createdAt'},
                            totalOrders: {$sum : 1},
                            totalSales: {
                                $sum:{
                                    $multiply:['$items.price', '$items.quantity']
                                }
                            }
                        }
                    },
                    {
                        $sort:{
                            _id:1
                        }
                    }
                ])

                //create new array with 12 size
                let chartDataMonthly = new Array(12).fill(0)
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                monthlyData.forEach(data =>{
                chartDataMonthly[data._id - 1] = data.totalSales
                })
                chartFilter = {
                    labels:monthNames,
                    datasets:[
                        {
                            label: 'totalSales',
                            data: chartDataMonthly
                        }
                    ]
                }
                break
            case 'yearly':
                filterStartDate = new Date(currDate.getFullYear()-5, 0, 1) //five years ago
                filterEndDate =    new Date(currDate.getFullYear(),11, 31, 23, 59, 59, 999)
 
                const yearlyData = await ordersCollection.aggregate([
                    {
                        $unwind:'$items'
                    },
                    {
                        $match:{
                            createdAt:{$gt:filterStartDate, $lte:filterEndDate},
                            'items.paymentStatus': 'paid'
                        }
                    },
                    {
                        $group:{
                            _id:{$year:'$createdAt'},
                            totalOrders:{$sum:1},
                            totalSales:{
                                $sum:{
                                    $multiply:['$items.price', '$items.quantity']
                                }
                            }
                        }
                    },
                    {
                        $sort:{
                            _id:1
                        }
                    }
                ])

                const years = Array.from({length: 6}, (_, i) => currDate.getUTCFullYear() - 5 + i);
                const chartDataYearly = years.map(year => {
                    const yearData = yearlyData.find(data => data._id === year);
                    return yearData ? yearData.totalSales : 0;
                });


                chartFilter = {
                    labels:years,
                    datasets:[
                        {
                            label: 'totalSales',
                            data: chartDataYearly
                        }
                    ]
                }
                break
            default: 
                filterStartDate = new Date(currDate.getFullYear(), 0, 1);
                filterEndDate = new Date(currDate.getFullYear(), 11, 31, 23, 59, 59, 999);
                
                const defaultData = await ordersCollection.aggregate([
                    {
                        $unwind:'$items'
                     },
                    {
                        $match:{
                            createdAt: {$gt: filterStartDate, $lte: filterEndDate},
                            'items.paymentStatus': 'paid'
                        }
                    },
                    {
                        $group:{
                            _id:{$month:'$createdAt'},
                            totalOrders: {$sum : 1},
                            totalSales: {
                                $sum:{
                                    $multiply:['$items.price', '$items.quantity']
                                }
                            }
                        }
                    },
                    {
                        $sort:{
                            _id:1
                        }
                    }
                ])
                //create new array with 12 size
                let chartDataDefault = new Array(12).fill(0)
                const defaultLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                defaultData.forEach(data =>{
                    chartDataDefault[data._id - 1] = data.totalSales
                })
                chartFilter = {
                    labels:defaultLabels,
                    datasets:[
                        {
                            label: 'totalSales',
                            data: chartDataDefault
                        }
                    ]
                }
                break      
        } 
        
        if (req.xhr || req.get('X-Requested-With') === 'XMLHttpRequest') {
            console.log('json requres')
            return res.json({chartFilter});
        }
        console.log('iam')

        //top selling products
        const topSellingProducts = await ordersCollection.aggregate([
            {
                $unwind: '$items'
            },
            {
                $match:{
                    'items.paymentStatus': 'paid'
                }
            },
            {
                $group:{ 
                    _id:'$items.productName',
                    totalQuantitySold:{ $sum: '$items.quantity' },
                    image:{$last: '$items.image'}
                      
                }
            },
            {
                $project:{
                    image:1,
                    _id:1,
                    totalQuantitySold:1
                }
            },
            {
                $sort :{
                    totalQuantitySold: -1
                }
            },
            {
                $limit: 10
            }
            
        ])
        const orderedTopSellingProducts = topSellingProducts.map(product => ({
            image:product.image,
            productName:product._id,
            totalQuantitySold:product.totalQuantitySold
        }))

        

        //top selling category
        const topSellingCategories = await ordersCollection.aggregate([
            {
                $unwind: '$items'
            },
            {
                $match:{
                    'items.paymentStatus': 'paid'
                }
            },
            {
                $group:{
                    _id:'$items.productId',
                    totalQuantitySold:{$sum: '$items.quantity'}
                }
            },
            {
                $lookup:{
                    from:'products',
                    localField:'_id',
                    foreignField:'_id',
                    as:'productsDetails'
                }
            },
            {
                $unwind:'$productsDetails'
            },
            {
                $group:{
                    _id: '$productsDetails.category',
                    totalQuantitySold:{ $sum: '$totalQuantitySold' }
                }
            },
            {
                $lookup:{
                    from:'categories',
                    localField:'_id',
                    foreignField:'_id',
                    as:'categoryDetails'
                }
            },
            {
                $unwind:'$categoryDetails'
            },
            {
                $project:{
                    _id:0,
                    categoryName: '$categoryDetails.categoryName',
                    totalQuantitySold:1
                }
            },
            {
                $sort:{
                    totalQuantitySold: -1
                }
            },
            {
                $limit:10
            }
        ])
        const orderedTopSellingCategories = topSellingCategories.map(category => ({
            categoryName:category.categoryName,
            totalQuantitySold:category.totalQuantitySold
        }))


        //top selling brand
        const topSellingBrands = await ordersCollection.aggregate([
            {
                $unwind:'$items'
            },
            {
                $match:{
                    'items.paymentStatus': 'paid'
                }
            },
            {
                $group:{
                    _id:'$items.productId',
                    totalQuantitySold:{
                        $sum:'$items.quantity'
                    }
                }
                
            },
            {
                $lookup:{
                    from:'products',
                    localField:'_id',
                    foreignField:'_id',
                    as:'productDetails'
                }
            },
            {
                $unwind:'$productDetails'
            },
            {
                $group:{
                    _id:'$productDetails.brand',
                    totalQuantitySold:{
                        $sum:'$totalQuantitySold'
                    }
                }
            },
            {
                $lookup:{
                    from:'brands',
                    localField:'_id',
                    foreignField:'_id',
                    as:'brandDetails'
                }
            },
            {
                $unwind:'$brandDetails'
            },
            {
                $project:{
                    _id:0,
                    brandName:'$brandDetails.brandName',
                    totalQuantitySold:1
                }
            },
            {
                $sort:{
                    totalQuantitySold:-1
                }
            },
            {
                $limit: 10
            }
        ])
        const orderedTopSellingbrands = topSellingBrands.map(brand => ({
            brandName:brand.brandName,
            totalQuantitySold:brand.totalQuantitySold
        }))
        


        res.render('Admin/dashBoard',
            {
                topSellingProducts:orderedTopSellingProducts,
                topSellingCategories:orderedTopSellingCategories,
                topSellingBrands:orderedTopSellingbrands,
                chartFilter: JSON.stringify(chartFilter)
            }
        )
    } catch (error) {
        console.error('something went wrong',error)
    }
}