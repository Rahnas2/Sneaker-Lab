
const walletCollection = require('../models/walletModel')



exports.getWallet = async (req, res) => {
    try {
        const userId = req.session.user;
        const { page = 1, limit = 5 } = req.query;
        
        const walletDoc = await walletCollection.findOne({ userId: userId });
        
        if (!walletDoc) {
            return res.json({ success: false, message: 'Wallet not found' });
        }
        
        const historyCount = walletDoc.history.length;
        const walletLimit = parseInt(limit);
        const walletPage = parseInt(page);
        const walletSkip = (walletPage - 1) * walletLimit;
        
        const sortedHistory = walletDoc.history
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(walletSkip, walletSkip + walletLimit);
        
        const pagination = {
            currentPage: walletPage,
            limit,
            totalPages: Math.ceil(historyCount / walletLimit)
        }

        res.json({
            success: true,
            wallet: {
                balance: walletDoc.balance,
                history: sortedHistory
            },
            pagination
        });
        
    } catch (error) {
        console.error('Error in getWalletPaginated:', error);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Error fetching wallet data' });
    }
};