


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


// cancel product
function cancelProductUser(orderId,itemId){
    try {
        Swal.fire({
            title: "Are you sure?",
            text: "You want to cancel the product",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then(result =>{
            if(result.isConfirmed){
                fetch('/cancelProductUser',{
                    method:'POST',
                    headers:{
                      'Content-Type':'application/json'
                    },
                    body:JSON.stringify({orderId,itemId})
                  })
                  .then(response => response.json())
                  .then(result =>{
                    if(result.success){
                      Swal.fire({
                        icon:'success',
                        title:'success',
                        text: result.message,
                        confirmButtonText:'ok'
                        })
                    }else{
                      Swal.fire({
                        icon:'error',
                        title:'error',
                        text: result.message,
                        confirmButtonText:'ok'
                        })
                    }
                  })
                .catch(error => console.error('error',error))
            }
        })  
    } catch (error) {
      console.error('someting went wrong',error)
    }
  }

  function openReturnModal(orderId, itemId){
         // Set the hidden input fields in the modal with the passed values
         document.getElementById('orderIdInput').value = orderId;
         document.getElementById('itemIdInput').value = itemId;

        // Trigger the modal
        $('#returnReason').modal('show');
  }

  document.getElementById('returnProductForm').addEventListener('submit', event =>{
    event.preventDefault()

    const orderId = document.getElementById('orderIdInput').value
    const itemId = document.getElementById('itemIdInput').value
    const returnReason = document.getElementById('returnReasonSelect').value

    fetch('/returnProduct',{
        method:JSON.stringify({orderId, itemId, returnReason}),
        headers:{
            'Content-Type': 'application/json'
        },
        body:JSON.stringify({orderId, itemId, returnReason})
    })
    .then(response => response.json())
    .then(result => {
        if(result.success){

        }else{
            
        }
    })

  })
