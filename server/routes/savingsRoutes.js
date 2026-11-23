const express = require('express');
const router = express.Router();
const { getAccounts, getAccountByMember, deposit, withdraw, getAccountTransactions, getSavingsStats } = require('../controllers/savingsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/stats', authorize('admin', 'staff'), getSavingsStats);
router.get('/', authorize('admin', 'staff'), getAccounts);
router.get('/member/:memberId', authorize('admin', 'staff', 'member'), getAccountByMember);
router.post('/:id/deposit', authorize('admin', 'staff'), deposit);
router.post('/:id/withdraw', authorize('admin', 'staff'), withdraw);
router.get('/:id/transactions', authorize('admin', 'staff', 'member'), getAccountTransactions);

module.exports = router;
