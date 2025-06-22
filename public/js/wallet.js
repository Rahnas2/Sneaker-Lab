async function loadWallet(page = 1) {
    if (page < 1) return;

    try {

        const response = await fetch(`/myProfile/wallet?page=${page}&limit=5`);
        const data = await response.json();

        if (data.success) {
            updateWalletContent(data.wallet, data.pagination);
            currentWalletPage = page;
        } else {
            console.log('Failed to load wallet history');
        }
    } catch (error) {
        console.error('Error loading wallet:', error);
    }
}

function updateWalletContent(wallet, pagination) {
    const container = document.getElementById('walletHistoryContainer');

    if (wallet.history.length === 0) {
        container.innerHTML = `
                <div class="text-center mt-4">
                    <h6>No transaction history</h6>
                    <p>You haven't made any transactions yet.</p>
                </div>
            `;
        return;
    }

    let historyHTML = `
            <h5 class="mt-4 mb-2">Transaction History</h5>
            <div class="table-responsive">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th scope="col">Amount</th>
                            <th scope="col">Status</th>
                            <th scope="col">Description</th>
                            <th scope="col">Date</th>
                            <th scope="col">Time</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    wallet.history.forEach(history => {
        const statusClass = history.status === 'credit' ? 'badge-success' : 'badge-danger';
        const date = history.createdAt ? new Date(history.createdAt).toLocaleDateString() : 'N/A';
        const time = history.createdAt ? new Date(history.createdAt).toLocaleTimeString() : 'N/A';

        historyHTML += `
                <tr>
                    <td>₹${history.amount}</td>
                    <td><span class="badge ${statusClass}">${history.status}</span></td>
                    <td>${history.description}</td>
                    <td>${date}</td>
                    <td>${time}</td>
                </tr>
            `;
    });

    historyHTML += `
                    </tbody>
                </table>
            </div>
        `;

    container.innerHTML = historyHTML;
    updateWalletPagination(pagination);
}



function updateWalletPagination(pagination) {
    if (pagination.totalPages <= 1) return;

    const existingPagination = document.getElementById('wallet-pagination');
    if (existingPagination) {
        existingPagination.remove();
    }

    let paginationHTML = `
            <nav id="wallet-pagination" aria-label="Wallet pagination" >
                <ul class="pagination mt-2 justify-content-end">
                <li class="page-item ${pagination.currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="loadWallet(${pagination.currentPage - 1})" aria-label="Previous">
                        <span aria-hidden="true">&laquo;</span>
                        <span class="sr-only">Previous</span>
                    </a>
                </li>
        `;

    for (let i = 1; i <= pagination.totalPages; i++) {
        paginationHTML += `
                <li class="page-item ${pagination.currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadWallet(${i})">${i}</a>
            </li>
            `;
    }

    paginationHTML += `
                    <li class="page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="loadWallet(${pagination.currentPage + 1})" aria-label="Next">
                        <span aria-hidden="true">&raquo;</span>
                        <span class="sr-only">Next</span>
                    </a>
                </li>
            </ul>
            </nav>
        `;

    document.getElementById('walletHistoryContainer').insertAdjacentHTML('beforeend', paginationHTML);
}