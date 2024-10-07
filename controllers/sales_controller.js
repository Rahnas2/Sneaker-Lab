const orderCollection = require('../models/orderModel')

const salesReportService = require('../services/salesReport')


exports.salesManagment = async (req,res)=>{
    try {
       const {sort, startDate, endDate} = req.query

       const searchQuery = req.query.search || ''
       const page = parseInt(req.query.page) || 1
       const limit = parseInt(req.query.limit) || 2
       const skip = (page-1)*limit
 
       console.log('query',req.query)
 
   //  let salesReportFilter = {}
 
   //  const today = new Date()
 
   //  switch(sort){
   //     case 'daily':
   //        salesReportFilter = {
   //           createdAt:{
   //              $gt:new Date(today.setHours(0, 0, 0, 0)),
   //              $lt:new Date(today.setHours(23, 59, 59, 999))
   //           }
   //        }
   //        break
   //     case 'weekly':
   //        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))
   //        salesReportFilter = {
   //           createdAt:{
   //              $gt:new Date(weekStart.setHours(0, 0, 0, 0)),
   //              $lt:new Date(today.setHours(23, 59, 59, 999))
   //           }
   //        }
   //        break
   //     case 'montly':
   //        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
   //        salesReportFilter = {
   //           createdAt:{
   //              $gt:new Date(monthStart.setHours(0, 0, 0, 0)),
   //              $lt:new Date(today.setHours(23, 59, 59, 999))
   //           }
   //        }
   //        break
   //     case 'yearly':
   //        const yearStart = new Date(today.getFullYear(),0, 1)
   //        salesReportFilter = {
   //           createdAt:{
   //              $gt:new Date(yearStart.setHours(0, 0, 0, 0)),
   //              $lt:new Date(today.setHours(23, 59, 59, 999))
   //           }
   //        }
   //        break
   //     case 'custom':
   //        if(startDate && endDate){
   //           salesReportFilter = {
   //              createdAt:{
   //                 $gt:new Date(new Date(startDate).setHours(0, 0, 0, 0)),
   //                 $lt:new Date(new Date(endDate).setHours(23, 59, 59, 999))
   //              }
   //           }
   //        }
   //        break     
   //        default:
   //           salesReportFilter = {}          
   //           break
   //  }
 
   //  const orders = await orderCollection.find({'items.paymentStatus':'paid',...salesReportFilter}).skip(skip).limit(limit)
 
   //  let totalSales = 0
   //  orders.forEach(order => {
   //     order.items.forEach(item => {
   //        totalSales +=  item.price * item.quantity
   //     })
   //  });
 
   //  const orderedPrice = orders.reduce((acc,curr) => acc + curr.totalAmount, 0)
 
   //  const totalDiscount =  totalSales - orderedPrice
 
   //  const totalOrders = orders.reduce((acc, curr) => acc + curr.items.length, 0)

   //  const totalPages = Math.ceil(totalOrders/limit)

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
       limit
    })
 
    } catch (error) {
       console.error('something went wrong',error)
    }
 }
 
 exports.downloadSalesReport = async (req,res) =>{
    try {
       const {format, filterType, startDate, endDate} = req.query
       console.log('req.query download',req.query)
       console.log('filter in admin side',filterType)
       
       const {orders, totalSales, totalDiscount, totalOrders, startedDate, endingDate} = await salesReportService.getSalesData(filterType, startDate, endDate)
       
 
       if(format === 'pdf'){
 
          salesReportService.generateSalesReportPDF(res, orders, totalSales, totalDiscount, totalOrders, startedDate, endingDate ); 
 
       }else if(format === 'excel'){
 
          salesReportService.generateSalesReportEXCEL(res, orders, totalSales, totalDiscount, totalOrders,  endDate)
 
       }
 
    } catch (error) {
       console.error('something went wrong',error)
    }
 }
 