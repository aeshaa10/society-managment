const express = require('express');
const router = express.Router();
const { getLoans, getMyLoans, getLoan, applyLoan, approveLoan, rejectLoan, disburseLoan, calculateLoan, getLoanStats, getLoanSchedule } = require('../controllers/loanController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public EMI calculator
router.post('/calculate', calculateLoan);

router.use(protect);

router.get('/stats', authorize('admin', 'staff'), getLoanStats);
router.get('/my', authorize('member'), getMyLoans);
router.get('/', authorize('admin', 'staff'), getLoans);
router.post('/', authorize('admin', 'staff', 'member'), applyLoan);
router.get('/:id', authorize('admin', 'staff', 'member'), getLoan);
router.patch('/:id/approve', authorize('admin'), approveLoan);
router.patch('/:id/reject', authorize('admin'), rejectLoan);
router.post('/:id/disburse', authorize('admin'), disburseLoan);
router.get('/:id/schedule', authorize('admin', 'staff', 'member'), getLoanSchedule);

module.exports = router;
