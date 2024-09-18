

document.querySelectorAll('.coupon-radio').forEach(radio =>{
    radio.addEventListener('click', function(){
        const selectedCoupon = this.value
        const couponInput = document.getElementById('coupon-code-input')
        couponInput.value = selectedCoupon
        couponInput.style.fontSize = '20px'
    })
})

document.getElementById('coupon-form').addEventListener('submit',event =>{
    event.preventDefault()

    const errorMessage = document.getElementById('coupon-notvalid')
    const couponParent = document.getElementById('coupon-parent')
    const couponContainer = document.getElementById('coupons-container')

    couponCode = document.getElementById('coupon-code-input').value


    fetch('/cart/applyCoupon',{
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
            // const savedAmount = result.couponDiscount
            // const couponCode = result.couponCode
            // couponContainer.remove()
            // const {header, appliedCoupon} = afterApplyCoupon(savedAmount, couponCode)

            // couponParent.appendChild(header)
            // couponParent.appendChild(appliedCoupon)
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


// function afterApplyCoupon(savedAmount, couponCode){
//   const header = document.createElement('h6')  
//   header.classList.add('text-uppercase')
//   header.textContent = 'applied coupon';
//   const appliedCoupon =  document.createElement('div')
//   appliedCoupon.classList.add('p-2', 'mb-3')
//   appliedCoupon.style.background = '#edf4e5';
//   appliedCoupon.style.border = '1px solid #39b54a';
//   appliedCoupon.innerHTML =`
//       <div class="text-warning font-weight-bold">You save:RS.${savedAmount}</div>
//       <p class="text-warning font-weight-bold">Coupon applied: ${couponCode}</P>
//   `;
//   return {header, appliedCoupon}
// }