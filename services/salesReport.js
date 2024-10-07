
const orderCollection = require('../models/orderModel')

exports.getSalesData = async (filterType, startDate, endDate) =>{
   console.log('get data',filterType)

    let salesReportFilter = {};

    let startedDate 
    let endingDate

    const today = new Date()
 
    switch(filterType){
       case 'daily':
         startedDate = new Date(today.setHours(0, 0, 0, 0))
         endingDate = new Date(today.setHours(23, 59, 59, 999))
          salesReportFilter = {
             createdAt:{
                $gt:startedDate,
                $lt:endingDate
             }
          }
          break
       case 'weekly':
          const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))
          startedDate = new Date(weekStart.setHours(0,0,0,0))
          endingDate = new Date(today.setDate(today.getDate()- today.getDay() + 6))
          endingDate.setHours(23, 59, 59, 999)
          salesReportFilter = {
             createdAt:{
                $gt:startedDate,
                $lt:endingDate
             }
          }
          break
       case 'monthly':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
          startedDate = new Date(monthStart.setHours(0, 0, 0, 0))
          endingDate = new Date(today.getFullYear(), today.getMonth()+ 1 , 0)
          endingDate.setHours(23, 59, 59, 999)
          salesReportFilter = {
             createdAt:{
                $gt:startedDate,
                $lt:endingDate
             }
          }
          break
       case 'yearly':
          const yearStart = new Date(today.getFullYear(),0, 1)
          startedDate = new Date(yearStart.setHours(0, 0, 0, 0))
          endingDate = new Date(today.getFullYear(),11, 31)
          endingDate.setHours(23, 59, 59, 999)
          salesReportFilter = {
             createdAt:{
                $gt:startedDate,
                $lt:endingDate
             }
          }
          break
       case 'custom':
          if(startDate && endDate){

          startedDate = new Date(new Date(startDate).setHours(0, 0, 0, 0))
          endingDate = new Date(new Date(endDate).setHours(23, 59, 59, 999))
             salesReportFilter = {
                createdAt:{
                   $gt:startedDate,
                   $lt:endingDate
                }
             }
          }
          break     
          default:
             salesReportFilter = {}          
             break
    }

    

    const orders = await orderCollection.find({'items.paymentStatus':'paid',...salesReportFilter})

    if (!startedDate && !endingDate) {
      const getDates = orders.map(order => new Date(order.createdAt));
      getDates.sort((a, b) => a - b);  // Sort in ascending order
      startedDate = getDates[0];
      endingDate = getDates[getDates.length - 1];
   }

   console.log('dates',startedDate,'end',endingDate)
    
   //  if(orders)
    let totalSales = 0
   orders.forEach(order => {
      order.items.forEach(item => {
         totalSales +=  item.price * item.quantity
      })
   });

   const orderedPrice = orders.reduce((acc,curr) => acc + curr.totalAmount, 0)

   const totalDiscount =  totalSales - orderedPrice

   const totalOrders = orders.reduce((acc, curr) => acc + curr.items.length, 0)

   return {
    orders,
    totalSales,
    totalDiscount,
    totalOrders,
    startedDate: startedDate.toLocaleDateString(),
    endingDate: endingDate.toLocaleDateString(),
    salesReportFilter
   }

} 




const PDFDocument = require('pdfkit');

exports.generateSalesReportPDF = (res, orders, totalSales, totalDiscount, totalOrders, startedDate, endingDate) => {
   console.log('staring date ',startedDate)
   console.log('ending date',endingDate)
  
    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right:10 },
        bufferPages: true
    });

    // Stream the PDF to the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
    doc.pipe(res);

    // Company Logo and Header
    doc.fontSize(24).font('Helvetica-Bold').text('SNEAKER LAB', { align: 'center' });
    doc.moveDown(1);

    // Title Section
    doc.fontSize(18).font('Helvetica-Bold').text('Sales Report', { align: 'center', underline: true });
    doc.fontSize(10).font('Helvetica').text(`Date Range: ${(startedDate)} to ${(endingDate)}`, { align: 'right' });
    doc.moveDown(1);

    // Summary Section
    doc.fontSize(14).font('Helvetica-Bold').text('Summary', { underline: true });
    doc.moveDown(0.5);

    // Display summary
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Orders: ${totalOrders}`);
    doc.text(`Total Sales: ${totalSales}`);
    doc.text(`Total Discount: ${totalDiscount}`);
    doc.moveDown(1);

    // Order Details Section
    doc.fontSize(14).font('Helvetica-Bold').text('Order Details', { underline: true });
    doc.moveDown(0.5);

    // Set column positions and widths
    const columns = {
        date: { x: 50, width: 80 },
        productName: { x: 130, width: 150 },
        total: { x: 280, width: 80 },
        quantity: { x: 360, width: 60 },
        discount: { x: 420, width: 80 },
        paymentMethod: { x: 500, width: 80 }
    };

    // Helper function to draw a table row
    const drawTableRow = (data, isHeader = false) => {
        const y = doc.y;
        doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
        
        Object.keys(columns).forEach(key => {
            doc.text(data[key], columns[key].x, y, {
                width: columns[key].width,
                align: key === 'date' || key === 'productName' ? 'left' : 'right'
            });
        });
        
        doc.moveDown(0.5);
    };

    // Table headers
    drawTableRow({
        date: 'Date',
        productName: 'Product Name',
        total: 'Total',
        quantity: 'Quantity',
        discount: 'Discount',
        paymentMethod: 'Payment'
    }, true);

    // Draw a line under the header
    doc.moveTo(50, doc.y).lineTo(580, doc.y).stroke();
    doc.moveDown(0.5);

    // Table rows
    orders.forEach(order => {
        order.items.forEach(item => {
            const discountValue = (item.price * item.quantity) - item.itemTotal;
            drawTableRow({
                date: order.createdAt.toDateString(),
                productName: item.productName,
                total: item.itemTotal,
                quantity: item.quantity.toString(),
                discount: discountValue,
                paymentMethod: order.paymentMethod
            });

            // Check for page overflow and add new page if needed
            if (doc.y > doc.page.height - 50) {
                doc.addPage();
                drawTableRow({
                    date: 'Date',
                    productName: 'Product Name',
                    total: 'Total',
                    quantity: 'Quantity',
                    discount: 'Discount',
                    paymentMethod: 'Payment'
                }, true);
                doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                doc.moveDown(0.5);
            }
        });
    });

    // Footer with page numbers
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).text(
            `Page ${i + 1} of ${range.count}`,
            0,
            doc.page.height - 30,
            { align: 'center', width: doc.page.width }
        );
    }

    // Finalize the PDF and end the response
    doc.end();
};




const ExcelJS = require('exceljs')

exports.generateSalesReportEXCEL = async (res, orders, totalSales, totalDiscount, totalOrders, startedDate, endingDate) =>{

   const workbook = new ExcelJS.Workbook()
   const worksheet = workbook.addWorksheet('Sales Report')

   //Add headers
   worksheet.columns = [
      { header: 'Date', key: 'orderDate', width: 20 },
      { header: 'Product Name', key: 'productName', width: 50 },
      { header: 'Total', key: 'total', width: 20 },
      { header: 'Quantity', key: 'quantity', width: 15 },
      { header: 'Discount', key: 'discount', width: 20 },
      { header: 'Payment Method', key: 'paymentMethod', width: 20 }
  ];

  // Add orders data
  orders.forEach(order => {
   order.items.forEach(item =>{
      const discountValue = (item.price * item.quantity) - item.itemTotal;
      worksheet.addRow({
         orderDate: new Date(order.createdAt).toLocaleDateString(),
         productName: item.productName,
         total: item.itemTotal,
         quantity: item.quantity,
         discount: discountValue,
         paymentMethod: order.paymentMethod
      });
   })
   })

    // Add the summary section
    worksheet.addRow([]);
    worksheet.addRow(['Summary']);
    worksheet.addRow([`Total Orders: ${totalOrders}`]);
    worksheet.addRow([`Total Sales: ${totalSales}`]);
    worksheet.addRow([`Total Discount: ${totalDiscount}`]);



   res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
   );
   res.setHeader(
      'Content-Disposition',
      'attachment; filename=sales_report.xlsx'
   );

   const buffer = await workbook.xlsx.writeBuffer();
   res.send(buffer);


}