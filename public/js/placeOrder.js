


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
                    const options = {
                        key: result.key,
                        amount: result.amount * 100,
                        currency: 'INR',
                        name:'SNEAKER LAB',
                        description: 'make your payment',
                        order_id: result.razorpayOrderId,
                        handler: function(response){
                            verifyPayment(response)     
                        },
                        theme: {
                            color: "#0000"
                        }
                    }
                    const rzp = new Razorpay(options)
                    rzp.on('payment.failed', function(response){
                        console.log('faild response',response)
                        handlePaymentFailure(response);
                    })
                    rzp.open()
                }else if(result.error){
                    console.log('error')
                    Swal.fire({
                    icon: 'error',
                    text: result.message,
                    confirmButtonText: 'OK'
                }) 
                }
                else{
                    console.log('cash on delivery')
                    handleSuccess(result.message)
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

//payment verify
function verifyPayment(response){
    fetch('/verifyPayment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            handleSuccess('Payment successful. Order placed successfully.',result.orderId);
        } else {
            handlePaymentFailure(result);
        }
    })
    .catch(err => {
        console.error('Error verifying payment:', err);
        handleError('An error occurred while verifying the payment.');
    })
}

// handle failure
function handlePaymentFailure(response) {
    fetch('/verifyPayment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            paymentId: response.error.metadata.payment_id,
            orderId: response.error.metadata.order_id,
            signature: null,
            failed:true
        })
    })
    .then(() => {
        Swal.fire({
            icon: 'warning',
            text: 'Payment failed. Your order has been created with a pending status.',
            confirmButtonText: 'OK'
        }).then(() => {
            window.location.href = '/myProfile'
        });
    })
}

//handle success payment 
function handleSuccess(message,orderId){
    Swal.fire({
        icon: 'success',
        text: message,
        confirmButtonText: 'OK'
    }).then(() => {
        window.location.href = `/orderDetail/${orderId}`; 
    })
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

    const reasonErr = document.getElementById('returnReasonError')

    if(returnReason === ''){
      reasonErr.classList.remove('d-none')
      return
    }

    fetch('/returnProduct',{
        method:'PUT',
        headers:{
            'Content-Type': 'application/json'
        },
        body:JSON.stringify({orderId, itemId, returnReason})
    })
    .then(response => response.json())
    .then(result => {
        if(result.success){
            Swal.fire({
                icon:'success',
                title:'success',
                text: result.message,
                confirmButtonText:'ok'
            })
            $('#returnReason').modal('hide');
        }else{
            Swal.fire({
                icon:'error',
                title:'error',
                text: result.message,
                confirmButtonText:'ok'
            }) 
        }
    })
    .catch(error =>{
        console.error('error',error)
    })

  })
