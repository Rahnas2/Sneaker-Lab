

const fullNameVal = document.getElementById('fullName-notValid')
const countryVal = document.getElementById('country-notValid')
const addressVal = document.getElementById('localAddress-notValid')
const cityVal = document.getElementById('city-notValid')
const stateVal = document.getElementById('state-notValid')
const pincodeVal = document.getElementById('pincode-notValid')
const mobileVal = document.getElementById('mobile-notValid')
const typeOfAddres = document.getElementById('addressType-notValid')

//add product
function postAddress(url){

    const addresssForm = document.getElementById('address-form')
    const formData = new FormData(addresssForm)
    
    const data = {
      fullName: formData.get('fullName'),
      country: formData.get('country'),
      localAddress: formData.get('localAddress'),
      city: formData.get('city'),
      state: formData.get('state'),
      pincode: formData.get('pincode'),
      mobile: formData.get('mobile'),
      email: formData.get('email'),
      typeOfAddress: formData.get('addressType'),
      defaultAddress: formData.get('defaultAddress')
      
  };

  console.log('data',data)

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
        console.log('result ',result)
        //clear all previous errors
        fullNameVal.classList.add('d-none')
        countryVal.classList.add('d-none') 
        addressVal.classList.add('d-none') 
        cityVal.classList.add('d-none')
        stateVal.classList.add('d-none')
        pincodeVal.classList.add('d-none') 
        mobileVal.classList.add('d-none')
        typeOfAddres.classList.add('d-none')

        if(result.validationError){
          console.log('validation eror',result.validationErrors)
          Object.entries(result.validationErrors).forEach(([field,message])=>{
            const validationFaild = document.getElementById(`${field}-notValid`)
            if(validationFaild){
              validationFaild.classList.remove('d-none')
              validationFaild.textContent = message
            }
      })
        }
        else if(result.success){
          console.log('source',result.source)
          localStorage.setItem('successMessage', result.message);
          if(result.source === '1'){
             window.location.href = '/myProfile'
          }else{
            window.location.href = '/cart/checkout'
          }
         }else{
          localStorage.setItem('errorMessage', result.message);
          if(result.source === '1'){
            window.location.href = '/myProfile'
          }else{
            window.location.href = '/cart/checkout'
          }
         }
       })
       .catch(error => {
        console.error('something went wrong',error)
       })
    } catch (error) {
      console.error('something went wrong',error)  
    }
}


//edit address get
function editAddress(url){
  try {
    fetch(url,{
      headers:{
        'Content-Type' : 'text/html'
      },
    })
    .then(response =>{
     if(response.ok){
      window.location.href = url
     }
    })
  } catch (error) {
    console.error('something went wrong',error)
  }
}


//update the address
function editAddressPut(url){
console.log('frontend')
  const addresssForm = document.getElementById('address-form')
  const formData = new FormData(addresssForm)
    
    const data = {
      fullName: formData.get('fullName'),
      country: formData.get('country'),
      localAddress: formData.get('localAddress'),
      city: formData.get('city'),
      state: formData.get('state'),
      pincode: formData.get('pincode'),
      mobile: formData.get('mobile'),
      email: formData.get('email'),
      typeOfAddress: formData.get('addressType'),
      defaultAddress: formData.get('defaultAddress'),
      
  };

     fetch(url,{
      method:'PUT',
      headers:{
        'Content-Type': 'application/json'
      },
      body:JSON.stringify(data)
     })

     .then(response => response.json())
     .then(result =>{
      console.log('result',result)
      if(result.validationError){
        console.log('validation error')
        Object.entries(result.validationErrors).forEach(([field,message])=>{
          const validationFaild = document.getElementById(`${field}-notValid`)
          if(validationFaild){
            validationFaild.classList.remove('d-none')
            validationFaild.textContent = message
          }
        })
      }
      if(result.success){
        console.log('success')
        localStorage.setItem('successMessage', result.message);
        if(result.source === '1'){
          window.location.href = '/myProfile'
           
        }else{
          window.location.href = '/cart/checkout'
        }
       }
     })
}

//delete address

function deleteAddress(url){
  const splitUrl = url.split('/')
  const AddressId = splitUrl[splitUrl.length -1]
  Swal.fire({
  title: "Are you sure?",
  text: "You want to remove the product",
  icon: "warning",
  showCancelButton: true,
  confirmButtonColor: "#3085d6",
  cancelButtonColor: "#d33",
  confirmButtonText: "Yes, delete it!"
}).then((result) => {
  if (result.isConfirmed) {
    fetch(url,{
        method:'DELETE',
    })
    .then(response => response.json())
    .then(result =>{
        if (result.success) {
          const deletedAddress = document.getElementById(`currAddress-${AddressId}`)
          deletedAddress.remove()
            Swal.fire({
            title: "Deleted!",
            text: result.message,
            icon: "success"
          });
            
        } else {
            console.log('error')
            Swal.fire({
            icon: "error",
            title: "Oops...",
            text: result.message,
          });
        }
    })

    
  }  
})  
.catch(error => console.log('something went wrong',error))
}  