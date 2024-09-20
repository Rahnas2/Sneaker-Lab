

document.querySelectorAll('.coupon-radio').forEach(radio =>{
    radio.addEventListener('click', function(){
        const selectedCoupon = this.value
        const couponInput = document.getElementById('coupon-code-input')
        couponInput.value = selectedCoupon
        couponInput.style.fontSize = '20px'
    })
})


//apply coupon
const applybutton = document.getElementById('apply-coupon-btn')
if(applybutton){
    applybutton.addEventListener('click',event =>{
        console.log('hello')
        event.preventDefault() 
    
        const errorMessage = document.getElementById('coupon-notvalid')
        const couponParent = document.getElementById('coupon-parent')
    
    
        couponCode = document.getElementById('coupon-code-input').value
    
    
        fetch('/checkOut/applyCoupon',{
            method:'POST',
            headers:{
                'Content-Type': 'application/json'
            },
            body:JSON.stringify({couponCode})
        })
        .then(response => response.json())
        .then(result => {
            errorMessage.classList.add('d-none')
            if(result.notValid){
               errorMessage.classList.remove('d-none')
               errorMessage.textContent = result.message
            }else if(result.success){
                location.reload()
    
            }else{
                Swal.fire({
                    icon: 'error',
                    text: result.message,
                    confirmButtonText: 'OK'
                });
            }
        })
        .catch(error => console.error('something went wrong',error))
    })
    
}

//remove coupon
function userRemoveCoupon(url, couponId){
    try {
        fetch(url,{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            }
        })
        .then(response => response.json())
        .then(result => {
            if(result.success){
                location.reload()

            }else{

            }
        })
    } catch (error) {
        console.error('something went wrong',error)
    }
}
