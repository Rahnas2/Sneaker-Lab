
function placeOrder(url){
    console.log('hello')
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
                console.log('success')
                Swal.fire({
                icon: 'success',
                text: result.message,
                confirmButtonText: 'OK'
            }) 
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