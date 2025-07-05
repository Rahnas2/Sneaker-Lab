

async function loadOrders(page = 1) {
    if (page < 1) return;

    try {

        const response = await fetch(`/myProfile/orders?page=${page}&limit=5`);
        const data = await response.json();

        if (data.success) {
            updateOrdersContent(data.orders, data.pagination);
            currentOrdersPage = page;
        } else {
            console.error('Failed to load orders');
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Update orders content
function updateOrdersContent(orders, pagination) {
    const container = document.getElementById('ordersContainer');

    if (orders.length === 0) {
        container.innerHTML = `
                <div class="card">
                    <div class="card-body text-center">
                        <h5>No orders found</h5>
                        <p>You haven't placed any orders yet.</p>
                    </div>
                </div>
            `;
        return;
    }

    let ordersHTML = '';
    orders.forEach(order => {
        ordersHTML += `
                <div class="card mb-4">
                    <div class="d-flex justify-content-between">
                        <h6 class="p-3 mb-0"><span class="font-weight-bold">Order Id:</span>${order._id}</h6>
                        <a href="/orderDetail/${order._id}"><span class="btn btn-primary m-2 p-2">View Detail</span></a>
                    </div>
            `;

        order.items.forEach(item => {
            const statusClass = item.status === 'delivered' ? 'badge-success' :
                item.status === 'canceled' ? 'badge-danger' :
                    item.status === 'order placed' ? 'badge-primary' : 'badge-danger';

            const paymentStatusClass = item.paymentStatus === 'paid' ? 'badge-success' :
                item.paymentStatus === 'pending' ? 'badge-warning' : 'badge-danger';

            ordersHTML += `
                    <div class="card-body p-0 table-responsive">
                        <table class="table mb-0">
                            <thead>
                                <tr>
                                    <th scope="col">Product</th>
                                    <th scope="col"></th>
                                    <th scope="col">Amount</th>
                                    <th scope="col">Quantity</th>
                                    <th scope="col">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th><img src="${item.image}" alt="product" width="80"></th>
                                    <td>${item.productName}</td>
                                    <td><strong>${item.itemTotal}</strong></td>
                                    <td>${item.quantity}</td>
                                    <td><span class="badge ${statusClass}">${item.status}</span></td>
                                </tr>
                                <tr>
                                    <th colspan="3">
                                        <span>Status:</span>
                                        <span class="badge ${paymentStatusClass}">${item.paymentStatus}</span>
                                    </th>
                                    <td colspan="3" class="text-right">
                                        ${item.status === 'delivered' ?
                    `<span type="button" onclick="openReturnModal('${order._id}','${item._id}')" class="text-danger font-weight-bold">Return?</span>` :
                    (item.status === 'order placed' || item.status === 'pending') ?
                        `<span type="button" onclick="cancelProductUser('${order._id}','${item._id}')" class="text-danger font-weight-bold">Cancel?</span>` : ''
                }
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;
        });

        ordersHTML += '</div>';
    });

    container.innerHTML = ordersHTML;
    updateOrdersPagination(pagination);
}

// Update pagination controls
function updateOrdersPagination(pagination) {
    // Remove existing pagination if any
    const existingPagination = document.getElementById('orders-pagination');
    if (existingPagination) {
        existingPagination.remove();
    }

    // Build new pagination with a unique wrapper ID
    let paginationHTML = `
        <nav id="orders-pagination" aria-label="Page navigation example">
            <ul class="pagination mt-2 justify-content-end">
                <li class="page-item ${pagination.currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="loadOrders(${pagination.currentPage - 1})" aria-label="Previous">
                        <span aria-hidden="true">&laquo;</span>
                        <span class="sr-only">Previous</span>
                    </a>
                </li>
    `;

    for (let i = 1; i <= pagination.totalPages; i++) {
        paginationHTML += `
            <li class="page-item ${pagination.currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadOrders(${i})">${i}</a>
            </li>
        `;
    }

    paginationHTML += `
                <li class="page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="loadOrders(${pagination.currentPage + 1})" aria-label="Next">
                        <span aria-hidden="true">&raquo;</span>
                        <span class="sr-only">Next</span>
                    </a>
                </li>
            </ul>
        </nav>
    `;

    // Append after clearing old one
    document.getElementById('orderDetails').insertAdjacentHTML('beforeend', paginationHTML);
}






function placeOrder(url) {

    const checkOutForm = document.getElementById('checkout-form')
    const formData = new FormData(checkOutForm)

    const data = {
        deliveryAddress: formData.get('selectedAddress'),
        paymentMethod: formData.get('paymentType')
    }

    try {
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(result => {
                console.log('result', result)
                if (result.success) {
                    if (result.razorpay) {
                        const options = {
                            key: result.key,
                            amount: result.amount * 100,
                            currency: 'INR',
                            name: 'SNEAKER LAB',
                            description: 'make your payment',
                            order_id: result.razorpayOrderId,
                            handler: function (response) {
                                verifyPayment({
                                    ...response,
                                    orderId: result.orderId
                                })
                            },
                            modal: {
                                ondismiss: function () {
                                    // User closed Razorpay popup
                                    fetch('/close-payment', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({ orderId: result.orderId })  
                                    }).then(() => {
                                        Swal.fire({
                                            icon: 'info',
                                            title: 'Payment Cancelled',
                                            text: 'You cancelled the payment. You can try again from your orders page.',
                                        })
                                    })
                                }
                            },
                            theme: {
                                color: "#0000"
                            }
                        }
                        const rzp = new Razorpay(options)
                        rzp.on('payment.failed', function (response) {
                            handlePaymentFailure({
                                ...response,
                                orderId: result.orderId
                            });
                        })
                        rzp.open()
                    } else if (result.error) {

                        Swal.fire({
                            icon: 'error',
                            text: result.message,
                            confirmButtonText: 'OK'
                        })
                    }
                    else {

                        handleSuccess(result.message)
                    }

                } else if (result.error) {

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
            .catch(err => console.error('error here', err))
    } catch (error) {
        console.error('something went wrong', error)

    }
}

//payment verify
function verifyPayment(response) {
    console.log('verify response ', response)
    fetch('/verifyPayment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            paymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id, // fixed
            signature: response.razorpay_signature,
            orderId: response.orderId
        })
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                handleSuccess('Payment successful. Order placed successfully.', result.orderId);
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
    console.log('resonpose in failure ', response)
    fetch('/verifyPayment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            paymentId: response.error.metadata.payment_id,
            razorpayOrderId: response.error.metadata.order_id,
            orderId: response.orderId,
            signature: null,
            failed: true
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
function handleSuccess(message, orderId) {
    Swal.fire({
        icon: 'success',
        text: message,
        confirmButtonText: 'OK'
    }).then(() => {
        window.location.href = `/orderDetail/${orderId}`;
    })
}


// cancel product
function cancelProductUser(orderId, itemId) {
    try {
        Swal.fire({
            title: "Are you sure?",
            text: "You want to cancel the product",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes"
        }).then(result => {
            if (result.isConfirmed) {
                fetch('/cancelProductUser', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ orderId, itemId })
                })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            Swal.fire({
                                icon: 'success',
                                title: 'success',
                                text: result.message,
                                confirmButtonText: 'ok'
                            })
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'error',
                                text: result.message,
                                confirmButtonText: 'ok'
                            })
                        }
                    })
                    .catch(error => console.error('error', error))
            }
        })
    } catch (error) {
        console.error('someting went wrong', error)
    }
}

function openReturnModal(orderId, itemId) {
    // Set the hidden input fields in the modal with the passed values
    document.getElementById('orderIdInput').value = orderId;
    document.getElementById('itemIdInput').value = itemId;

    // Trigger the modal
    $('#returnReason').modal('show');
}

document.getElementById('returnProductForm').addEventListener('submit', event => {
    event.preventDefault()

    const orderId = document.getElementById('orderIdInput').value
    const itemId = document.getElementById('itemIdInput').value
    const returnReason = document.getElementById('returnReasonSelect').value

    const reasonErr = document.getElementById('returnReasonError')

    if (returnReason === '') {
        reasonErr.classList.remove('d-none')
        return
    }

    fetch('/returnProduct', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId, itemId, returnReason })
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'success',
                    text: result.message,
                    confirmButtonText: 'ok'
                })
                $('#returnReason').modal('hide');
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'error',
                    text: result.message,
                    confirmButtonText: 'ok'
                })
            }
        })
        .catch(error => {
            console.error('error', error)
        })

})
