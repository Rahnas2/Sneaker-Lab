

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

// error messages element for product modal
const prdidValidation = document.getElementById('productId-notvalid')
const prddiscountPercentageValidation = document.getElementById('productDiscountPercentage-notvalid')
const prdexpDateValidation = document.getElementById('ProductOffExpiry-notvalid')

// error messages element for category modal
const catidValidation = document.getElementById('categoryId-notvalid')
const catdiscountPercentageValidation = document.getElementById('categoryDiscountPercentage-notvalid')
const catexpDateValidation = document.getElementById('categoryOffExpiry-notvalid')


//==========add product offer==========//
const productOfferForm = document.getElementById('add-productOffer')


productOfferForm.addEventListener('submit', event =>{
    event.preventDefault()

    const formData = new FormData(productOfferForm)

    const idValidation = document.getElementById('productId-notvalid')
    const discountPercentageValidation = document.getElementById('productDiscountPercentage-notvalid')
    const expDateValidation = document.getElementById('ProductOffExpiry-notvalid')

    //clear previous erros
    prdclearValidationErrors()

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

//==========edit product offer=========//
function editProductOffer(productId, discountPercentage, expiry){

    document.getElementById('addProductOfferModalLabel').textContent = 'Edit Product Offer'

    const productDropdown = document.querySelector('select[name="productId"]')

    for(i=0;i<productDropdown.options.length;i++){
        if(productDropdown.options[i].value == productId){
            productDropdown.options[i].selected = true
            break
        }
    }

    productDropdown.setAttribute('readonly',true);
    
    document.getElementById('productDiscountPercentage').value = discountPercentage
    document.getElementById('ProductOffExpiry').value = new Date(expiry).toISOString().slice(0, 16)

    productOfferForm.addEventListener('submit',event =>{
        event.preventDefault()

    const formData = new FormData(productOfferForm)

    const idValidation = document.getElementById('productId-notvalid')
    const discountPercentageValidation = document.getElementById('productDiscountPercentage-notvalid')
    const expDateValidation = document.getElementById('ProductOffExpiry-notvalid')

    //clear previous erros
    prdclearValidationErrors()

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
            text: 'Offer Updated Successfully',
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
}

//==========add category offer==========//

const categoryOfferForm = document.getElementById('add-categoryOffer')

categoryOfferForm.addEventListener('submit', event =>{
    event.preventDefault()
    const formData = new FormData(categoryOfferForm)

    const idValidation = document.getElementById('categoryId-notvalid')
    const discountPercentageValidation = document.getElementById('categoryDiscountPercentage-notvalid')
    const expDateValidation = document.getElementById('categoryOffExpiry-notvalid')

    //clear previous erros
    catclearValidationErrors()

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


//==========edit category offer=========//
function editCategoryOffer(categoryId, discountPercentage, expiry){

    document.getElementById('addCategoryOfferModalLabel').textContent = 'Edit Product Offer'

    const categoryDropdown = document.querySelector('select[name="categoryId"]')

    for(i=0;i<categoryDropdown.options.length;i++){
        if(categoryDropdown.options[i].value == categoryId){
            categoryDropdown.options[i].selected = true
            break
        }
    }

    categoryDropdown.setAttribute('readonly',true);
    
    document.getElementById('categoryDiscountPercentage').value = discountPercentage
    document.getElementById('categoryOffExpiry').value = new Date(expiry).toISOString().slice(0, 16)

    categoryOfferForm.addEventListener('submit',event =>{
        event.preventDefault()

    const formData = new FormData(categoryOfferForm)

    const idValidation = document.getElementById('categoryId-notvalid')
    const discountPercentageValidation = document.getElementById('categoryDiscountPercentage-notvalid')
    const expDateValidation = document.getElementById('categoryOffExpiry-notvalid')

    //clear previous erros
    catclearValidationErrors()

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
            text: 'Offer Updated Successfully',
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
}


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



function resetProductModal() {    //remove all values and validation error message from product modal
    document.getElementById('addProductOfferModalLabel').textContent = 'Add Product Offer';

    // Clear the form fields
    const productDropdown = document.querySelector('select[name="productId"]')
    productDropdown.options[0].selected = true
    productDropdown.removeAttribute('readonly',true)

    document.getElementById('productDiscountPercentage').value = '';
    document.getElementById('ProductOffExpiry').value = '';

    // Clear previous error messages
    prdclearValidationErrors(); // Call a function to hide all validation messages
}


function resetCategoryModal() {    //remove all values and validation error message from product modal
    document.getElementById('addCategoryOfferModalLabel').textContent = 'Add Category Offer';

    // Clear the form fields
    const categoryDropdown = document.querySelector('select[name="categoryId"]')
    categoryDropdown.options[0].selected = true
    categoryDropdown.removeAttribute('readonly',true)

    document.getElementById('categoryDiscountPercentage').value = '';
    document.getElementById('categoryOffExpiry').value = '';

    // Clear previous error messages
    catclearValidationErrors(); // Call a function to hide all validation messages
}


function prdclearValidationErrors(){
    prdidValidation.classList.add('d-none')
    prddiscountPercentageValidation.classList.add('d-none')
    prdexpDateValidation.classList.add('d-none')
}

function catclearValidationErrors(){
    catidValidation.classList.add('d-none')
    catdiscountPercentageValidation.classList.add('d-none')
    catexpDateValidation.classList.add('d-none')
}