const express = require('express');
const router = express.Router();
const { getDashboardSummary, getLoanReport, getTransactionReport, getOutstandingReport, getOverdueReport, getMemberReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect, authorize('admin', 'staff'));

router.get('/dashboard', getDashboardSummary);
router.get('/loans', getLoanReport);
router.get('/transactions', getTransactionReport);
router.get('/outstanding', getOutstandingReport);
router.get('/overdue', getOverdueReport);
router.get('/members', getMemberReport);

module.exports = router;
