
 // Function to show the appropriate offer section based on the selected tab
 function showOfferSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.offer-section').forEach(function(section) {
        section.style.display = 'none';
    });

    // Remove active class from all tabs
    document.querySelectorAll('.nav-link').forEach(function(tab) {
        tab.classList.remove('active');
    });

    // Show the selected section
    document.getElementById(sectionId).style.display = 'block';

    // Add active class to the clicked tab
    switch (sectionId) {
        case 'productOffers':
            document.getElementById('productOffersTab').classList.add('active');
            break;
        case 'categoryOffers':
            document.getElementById('categoryOffersTab').classList.add('active');
            break;
        case 'referralOffers':
            document.getElementById('referralOffersTab').classList.add('active');
            break;
    }
}


function updateMinDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    const expiryDateInputPro = document.getElementById('ProductOffExpiry');
    const expiryDateInputCat = document.getElementById('categoryOffExpiry')

    expiryDateInputPro.min = minDateTime
    expiryDateInputCat.min = minDateTime

}

setInterval(updateMinDateTime, 60000);


updateMinDateTime();


//==========add product offer==========//
const productOfferForm = document.getElementById('add-productOffer')

productOfferForm.addEventListener('submit', event =>{
    event.preventDefault()

    const formData = new FormData(productOfferForm)

    const idValidation = document.getElementById('productId-notvalid')
    const discountPercentageValidation = document.getElementById('productDiscountPercentage-notvalid')
    const expDateValidation = document.getElementById('ProductOffExpiry-notvalid')

    //clear previous erros
    idValidation.classList.add('d-none')
    discountPercentageValidation.classList.add('d-none')
    expDateValidation.classList.add('d-none')

    const data ={
        productId:formData.get('productId'),
        discountPercentage:formData.get('productDiscountPercentage').trim(),
        expirAt:formData.get('ProductOffExpiry')
    }

    // Client-side validation

    if (!data.productId) {
        idValidation.classList.remove('d-none');
        idValidation.textContent = 'Please select a product.';
        return;
    }

    if (!data.discountPercentage || isNaN(data.discountPercentage) || data.discountPercentage <= 0 || data.discountPercentage > 100) {
        discountPercentageValidation.classList.remove('d-none')
        discountPercentageValidation.textContent = 'Please enter a valid discount percentage between 1 and 100.'
        return;
    }

    if (!data.expirAt || new Date(data.expirAt) <= new Date()) {
        expDateValidation.classList.remove('d-none')
        expDateValidation.textContent = 'Please select a future expiry date and time.';
        return;
    }

    fetch('/admin/offerManagment/addProductOffer',{
        method:'POST',
        headers:{
            'Content-Type': 'application/json'
        },
        body:JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result =>{
        if(result.success){
            const modal = bootstrap.Modal.getInstance(document.getElementById('addProductOfferModal'));
            modal.hide();
            Swal.fire({
            icon: 'success',
            text: result.message,
            confirmButtonText: 'OK'
            });
        }else{
            Swal.fire({
                icon: 'error',
                text: result.message,
                confirmButtonText: 'OK'
            });
        }
    })
    .catch(error => {
        console.error('something went wrong',error)
    })
})


//==========add category offer==========//

const categoryOfferForm = document.getElementById('add-categoryOffer')

categoryOfferForm.addEventListener('submit', event =>{
    event.preventDefault()
    const formData = new FormData(categoryOfferForm)

    const idValidation = document.getElementById('categoryId-notvalid')
    const discountPercentageValidation = document.getElementById('categoryDiscountPercentage-notvalid')
    const expDateValidation = document.getElementById('categoryOffExpiry-notvalid')

    //clear previous erros
    idValidation.classList.add('d-none')
    discountPercentageValidation.classList.add('d-none')
    expDateValidation.classList.add('d-none')

    const data ={
        categoryId:formData.get('categoryId'),
        discountPercentage:formData.get('categoryDiscountPercentage').trim(),
        expirAt:formData.get('categoryOffExpiry')
    }

    // Client-side validation
    if (!data.categoryId) {
        idValidation.classList.remove('d-none');
        idValidation.textContent = 'Please select a category.';
        return;
    }

    if (!data.discountPercentage || isNaN(data.discountPercentage) || data.discountPercentage <= 0 || data.discountPercentage > 100) {
        discountPercentageValidation.classList.remove('d-none')
        discountPercentageValidation.textContent = 'Please enter a valid discount percentage between 1 and 100.'
        return;
    }

    if (!data.expirAt || new Date(data.expirAt) <= new Date()) {
        expDateValidation.classList.remove('d-none')
        expDateValidation.textContent = 'Please select a future expiry date and time.';
        return;
    }

    fetch('/admin/offerManagment/addCategoryOffer',{
        method:'POST',
        headers:{
            'Content-Type': 'application/json'
        },
        body:JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result =>{
        if(result.success){
            const modal = bootstrap.Modal.getInstance(document.getElementById('addCategoryOfferModal'));
            modal.hide();
            Swal.fire({
            icon: 'success',
            text: result.message,
            confirmButtonText: 'OK'
            });
        }else{
            Swal.fire({
                icon: 'error',
                text: result.message,
                confirmButtonText: 'OK'
            });
        }
    })
    .catch(error => {
        console.error('something went wrong',error)
    })
    
})


//===========delete product offer===========//
function deleteProductOffer(url,productId){
    try {

        Swal.fire({
            title: "Are you sure?",
            text: "You want to remove the offer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
          })
          .then(result => {
            if(result.isConfirmed){

                fetch(url,{
                    method:'DELETE',
                    headers:{
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(result => {
                    if(result.success){
                        document.getElementById(`product-${productId}`).remove()
                        console.log(result.message)
                    }else{
        
                    }
                })
                .catch(error => console.error('error',error))

            }
          })
    } catch (error) {
        conosole.error('something went wrong',error)
    }
}



//===========delete category offer===========//
function deleteCategoryOffer(url,categoryId){
    console.log('categoryid',categoryId)
    try {
        Swal.fire({
            title: "Are you sure?",
            text: "You want to remove the offer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
          })
          .then(result => {
            if(result.isConfirmed){

                fetch(url,{
                    method:'DELETE',
                    headers:{
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(result => {
                    if(result.success){
                       document.getElementById(`category-${categoryId}`).remove()
                       console.log(result.message)
                    }else{
        
                    }
                })
                .catch(error => console.error('error',error))

            }
          })
        
    } catch (error) {
        conosole.error('something went wrong',error)
    }
}