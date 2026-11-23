const express = require('express');
const router = express.Router();
const { getInstallmentsByLoan, payInstallment, getOverdueInstallments, getUpcomingInstallments, getRepaymentStats } = require('../controllers/installmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/stats', authorize('admin', 'staff'), getRepaymentStats);
router.get('/overdue', authorize('admin', 'staff'), getOverdueInstallments);
router.get('/upcoming', authorize('admin', 'staff'), getUpcomingInstallments);
router.get('/loan/:loanId', authorize('admin', 'staff', 'member'), getInstallmentsByLoan);
router.post('/:id/pay', authorize('admin', 'staff'), payInstallment);

module.exports = router;
