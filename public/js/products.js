let searchQuery = new URLSearchParams(window.location.search).get('search') || '';
let selectedCategory = new URLSearchParams(window.location.search).get('category') || '';
let selectedBrand = new URLSearchParams(window.location.search).get('brand') || '';
let selectedFilter =  new URLSearchParams(window.location.search).get('filter') || '';
let currentPage =  parseInt(new URLSearchParams(window.location.search).get('page')) || 1;

function fetchProducts() {
  const query = new URLSearchParams({
    search: searchQuery,
    category: selectedCategory,
    brand: selectedBrand,
    filter: selectedFilter,
    page: currentPage
  });

  fetch(`/products?${query}`)
    .then(response => response.json())
    .then(data => {
      renderProducts(data.products, data.productsInCart, data.averageRating);
      renderPagination(data.totalProducts);
    })
    .catch(err => console.error('Fetch error:', err));
}

function renderProducts(products, productsInCart, averageRating) {
  const productList = document.getElementById('product-list');
  productList.innerHTML = '';

  if (!products.length) {
    const EmtyProductList = `<div class="col-12 text-center my-5">
                                <h5 class="text-muted">No products found</h5>
                                <p class="text-secondary">Try adjusting your filters or search terms.</p>
                            </div>`

    productList.innerHTML += EmtyProductList
    return
  }
  
  products.forEach(product => {
    const productId = product._id;
    const name = product.productName;
    const price = product.variants[0].price;
    const image = product.variants[0].images[0];
    const stock = product.variants[0].sizes[0].stock;
    const offer = product.offer;
    const avgRating = averageRating[productId] || 0;

    // Generte Rating Stars
    let ratingHTML = '';
    for (let i = 1; i <= 5; i++) {
      if (avgRating >= i) {
        ratingHTML += `<i class="fa-solid fa-star text-warning"></i>`;
      } else {
        ratingHTML += `<i class="fa-regular fa-star text-warning"></i>`;
      }
    }

    // Calculate Price and Offer Price
    let priceHTML = '';
    if (offer && new Date(offer.expirAt) >= new Date()) {
      const offerPrice = Math.round(price - (price * offer.discountPercentage / 100));
      priceHTML = `
        <h5 class="d-inline mr-2" id="dicoutedPrice-${productId}">₹${offerPrice}</h5>
        <h6 class="d-inline" id="mrp-${productId}" style="text-decoration: line-through;">₹${price}</h6>
        <span class="ml-2 red">(${offer.discountPercentage}%) off</span>
      `;
    } else {
      priceHTML = `<h5 id="mrp-${productId}">₹${price}</h5>`;
    }

    let cartActionHTML = '';
    if (stock === 0) {
      cartActionHTML = `<span class="text-warning fs-14">out of stock</span>`;
    } else {
      cartActionHTML = `
        <span id="cart-action-${productId}" 
          onclick="${productsInCart[productId] ? `checkAccess('/cart')` : `addCart('/addToCart/${productId}')`}">
          ${productsInCart[productId] ? `<i class='fa-solid fa-arrow-right'></i> GO TO CART` : '+ ADD TO CART'}
        </span>
      `;
    }

    const productHTML = `
        <div class="col-lg-4 col-md-6 col-sm-6">
          <div class="product__item">
            <div class="img-hover-zoom overflow-hidden">
              <a href="/viewProduct/${productId}"><img src="${image}" alt="image"></a>
            </div>
            <div class="product__item__text">
              <h6>${name}</h6>
              ${cartActionHTML}
              <div class="rating">
                ${ratingHTML}
              </div>
              ${priceHTML}
              <div class="product__color__select">
                <label for="pc-4"><input type="radio" id="pc-4"></label>
                <label class="active black" for="pc-5"><input type="radio" id="pc-5"></label>
                <label class="grey" for="pc-6"><input type="radio" id="pc-6"></label>
              </div>
            </div>
          </div>
        </div>
    `;

    productList.innerHTML += productHTML;
  });
}

function renderPagination(totalProducts) {
  const pagination = document.getElementById('shope-pagination');
  const totalPages = Math.ceil(totalProducts / 10);
  pagination.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `<span class="${currentPage === i ? 'active' : ''}" onclick="changePage(${i})">${i}</span>`;
  }
}

function changePage(page) {
  currentPage = page;

  const url = new URL(window.location);
  url.searchParams.set('page', currentPage);
  history.pushState({}, '', url)

  fetchProducts();
}

function applyFilter() {
  selectedFilter = document.getElementById('filter').value;
  currentPage = 1;

  const url = new URL(window.location);
  url.searchParams.set('filter', selectedFilter);
  url.searchParams.set('page', currentPage);
  history.pushState({}, '', url);

  fetchProducts();
}

//category filter
function categoryFilter(event, category) {
  event.preventDefault()

  document.querySelectorAll('.shop__sidebar__categories ul li span').forEach(el => {
    el.classList.remove('active');
  });

  event.target.classList.add('active');

  selectedCategory = category;
  currentPage = 1;

  const url = new URL(window.location);
  url.searchParams.set('category', selectedCategory);
  url.searchParams.set('page', currentPage);
  history.pushState({}, '', url);

  fetchProducts();
}

//brand filter
function brandFilter(event, brand) {
  event.preventDefault();

  document.querySelectorAll('.shop__sidebar__brand ul li span').forEach(el => {
    el.classList.remove('active');
  });
  event.target.classList.add('active');

  selectedBrand = brand;
  currentPage = 1;

  const url = new URL(window.location);
  url.searchParams.set('brand', selectedBrand);
  url.searchParams.set('page', currentPage);
  history.pushState({}, '', url);

  fetchProducts();
}

// Search Filter
function searchFilter(search) {
  searchQuery = search
  currentPage = 1

  const url = new URL(window.location.href);
  url.searchParams.set('search', searchQuery);
  url.searchParams.set('page', currentPage);
  history.pushState({}, '', url);

  fetchProducts()
}