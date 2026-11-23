const express = require('express');
const router = express.Router();
const { getTransactions, getTransaction, getMyTransactions, getTransactionStats } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/stats', authorize('admin', 'staff'), getTransactionStats);
router.get('/my', authorize('member'), getMyTransactions);
router.get('/', authorize('admin', 'staff'), getTransactions);
router.get('/:id', authorize('admin', 'staff', 'member'), getTransaction);

module.exports = router;
