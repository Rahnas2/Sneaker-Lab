const orderCollection = require('../models/orderModel')

const salesReportService = require('../services/salesReport')


exports.salesManagment = async (req,res)=>{
    try {
       const {sort, startDate, endDate} = req.query

       const searchQuery = req.query.search || ''
       const page = parseInt(req.query.page) || 1
       const limit = parseInt(req.query.limit) || 10
       const skip = (page-1)*limit
 
 

   const {totalSales, totalDiscount, totalOrders, salesReportFilter} = await salesReportService.getSalesData(sort, startDate, endDate)

   const orders = await orderCollection.find({'items.paymentStatus':'paid',...salesReportFilter}).skip(skip).limit(limit)

    const totalPages = Math.ceil(totalOrders/limit)
    
    res.render('Admin/salesManagment',{
       orders,
       totalSales,
       totalDiscount,
       totalOrders,
       currentPage:page,
       totalPages,
       limit,
       sort
    })
 
    } catch (error) {
       console.error('something went wrong',error)
    }
 }
 
 exports.downloadSalesReport = async (req,res) =>{
    try {
       const {format, filterType, startDate, endDate} = req.query

       
       const {orders, totalSales, totalDiscount, totalOrders, startedDate, endingDate} = await salesReportService.getSalesData(filterType, startDate, endDate)
       
 
       if(format === 'pdf'){
 
          salesReportService.generateSalesReportPDF(res, orders, totalSales, totalDiscount, totalOrders, startedDate, endingDate ); 
 
       }else if(format === 'excel'){
 
          salesReportService.generateSalesReportEXCEL(res, orders, totalSales, totalDiscount, totalOrders, startedDate, endDate)
 
       }
 
    } catch (error) {
       console.error('something went wrong',error)
    }
 }
 