


function placeOrder(url){
    
    const checkOutForm = document.getElementById('checkout-form')
    const formData = new FormData(checkOutForm)

    const data = {
        deliveryAddress:formData.get('selectedAddress'),
        paymentMethod:formData.get('paymentType')
    }

    try {
        fetch(url,{
            method:'POST',
            headers:{
                'Content-Type': 'application/json'
            },
            body:JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result =>{
            console.log('result',result)
            if(result.success){
                if(result.razorpay){
                    console.log('razorpay')
                    const options = {
                        key: result.key,
                        amount: result.amount * 100,
                        currency: 'INR',
                        name:'SNEAKER LAB',
                        description: 'make your payment',
                        order_id: result.razorpayOrderId,
                        handler: function(response){

                            fetch('/verifyPayment',{
                                method:'POST',
                                headers:{
                                    'Content-Type': 'application/json'
                                },
                                body:JSON.stringify({
                                    paymentId: response.razorpay_payment_id,
                                    orderId: response.razorpay_order_id,
                                    signature: response.razorpay_signature
                                })
                            })  
                            .then(response => response.json())
                            .then(result => {
                                if (result.success) {
                                    Swal.fire({
                                        icon: 'success',
                                        text: 'Payment verified successfully!',
                                        confirmButtonText: 'OK'
                                    });
                                } else {
                                    Swal.fire({
                                        icon: 'error',
                                        text: 'Payment verification failed.',
                                        confirmButtonText: 'OK'
                                    });
                                }
                            })  

                        },
                        theme: {
                            color: "#0000"
                        }
                    }
                    const rzp = new Razorpay(options)
                    rzp.open()
                }else{
                    console.log('cash on delivery')
                    Swal.fire({
                    icon: 'success',
                    text: result.message,
                    confirmButtonText: 'OK'
                }) 
                }
      
            }else if(result.error){
                console.log('error')
                Swal.fire({
                icon: 'error',
                text: result.message,
                confirmButtonText: 'OK'
            }) 
            }
            else {
               console.log('something went wrong')
            }
        })
        .catch(err => console.error('error here',err))
    } catch (error) {
        console.error('something went wrong',error)
        
    }
}