
const orderCollection = require('../models/orderModel')
const PDFDocument = require('pdfkit')

exports.invoiceDownload = async (res, orderId) =>{
    console.log('hello')

    const order = await orderCollection.findOne({_id:orderId})

    //original price
    const totalMrp = order.items.reduce((acc,curr) =>{
       return acc += curr.price * curr.quantity
    },0)

    //offer price
    const soldPrice = order.items.reduce((acc,curr) =>{
        return acc += curr.offerPrice * curr.quantity
    },0)

    //discound on mrp
    const discountOnMrp = totalMrp - soldPrice


    console.log('product',order)

    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 10, right: 10 },
        bufferPages: true
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Invoice.pdf');
    doc.pipe(res);

    // Invoice Title
    doc.fontSize(18).font('Helvetica-Bold').text('Invoice', { align: 'center', underline: true });
    doc.moveDown(1);

    // Order and Shipping Information

    doc.fontSize(12).font('Helvetica-Bold').text('Compay Name: ', { continued: true })
    doc.font('Helvetica').text('SNEAKER LAB');

    doc.fontSize(12).font('Helvetica-Bold').text('Order ID: ', { continued: true });
    doc.font('Helvetica').text(`${order._id.toString().slice(-6) }`);

    doc.fontSize(12).font('Helvetica-Bold').text('Customer Name: ', { continued: true });
    doc.font('Helvetica').text(`${order.deliveryAddress.fullName }`);

    doc.fontSize(12).font('Helvetica-Bold').text('Order Date: ', { continued: true });
    doc.font('Helvetica').text(`${order.createdAt.toDateString()}`);
    
    doc.font('Helvetica-Bold').text('Shipping To: ', { continued: true });
    doc.font('Helvetica').text(`${order.deliveryAddress.fullName}, ${order.deliveryAddress.localAddress}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state}, ${order.deliveryAddress.pinCode}, ${order.deliveryAddress.country}`);

    doc.font('Helvetica-Bold').text('Payment Method: ', { continued: true });
    doc.font('Helvetica').text(`${order.paymentMethod}`);

    doc.moveDown(1);

    // Items Table
    doc.fontSize(14).font('Helvetica-Bold').text('Items Ordered', { underline: true });
    doc.moveDown(0.5);

    // Set column positions and widths for the table
    const columns = {
        productName: { x: 10, width: 100 },
        price: { x: 110, width: 60 },
        offerPrice: {x:180, width:60 },
        quantity: { x: 250, width: 60 },
        couponDiscount: { x: 320, width: 90 },
        itemTotal: { x: 400, width: 60 },
        status: { x: 470, width: 70 }
    };

    // Helper function to draw a table row
    const drawTableRow = (data, isHeader = false) => {
        const y = doc.y;
        doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
        
        Object.keys(columns).forEach(key => {
            doc.text(data[key], columns[key].x, y, {
                width: columns[key].width,
                align: key === 'productName' ? 'left' : 'right'
            });
        });
        doc.moveDown(0.5);
    };

    // Table headers
    drawTableRow({
        productName: 'Product Name',
        price: 'Price',
        offerPrice:'Offer Price',
        quantity: 'Quantity',
        couponDiscount: 'CouponDiscount',
        itemTotal: 'Item Total',
        status: 'Status'
    }, true);

    // Draw a line under the header
    doc.moveTo(10, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Table rows for each item in the order
    order.items.forEach(item => {
        drawTableRow({
            productName: item.productName,
            price: `${item.price}`,
            offerPrice: `${item.offerPrice}`,
            quantity: item.quantity.toString(),
            couponDiscount: `${(item.offerPrice * item.quantity) - item.itemTotal}`,
            itemTotal: `${item.itemTotal}`,
            status: item.status
        });
   

        // Check for page overflow and add a new page if needed
        if (doc.y > doc.page.height - 50) {
            doc.addPage();
            drawTableRow({
                productName: 'Product Name',
                price: 'Price',
                offerPrice: 'OfferPrice',
                quantity: 'Quantity',
                couponDiscount:'CouponDiscount',
                itemTotal: 'Item Total',
                status: 'Status'
            }, true);
            doc.moveTo(10, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);
        }
    });

    doc.moveDown(1);

     // Summary Section
     doc.fontSize(14).font('Helvetica-Bold').text('Summary', 10, doc.y,  { underline: true });
     doc.moveDown(0.5);
 
     // Display summary
     doc.fontSize(10).font('Helvetica');
     doc.text(`Total Mrp: ${totalMrp}`);
     doc.text(`Discount On Mrp: ${discountOnMrp}`);
     doc.text(`Coupon Discount: ${order.couponDiscount}`);
     doc.text(`Shipping Fee: ${order.shippingFee}`);
     doc.text(`Total Amount: ${order.totalAmount}`);
     doc.moveDown(1);

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

}