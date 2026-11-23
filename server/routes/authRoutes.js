const express = require('express');
const router = express.Router();
const { login, getMe, changePassword, forgotPassword, resetPassword, createStaff, getStaff, toggleStaffStatus } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Staff management (admin only)
router.post('/create-staff', protect, authorize('admin'), createStaff);
router.get('/staff', protect, authorize('admin'), getStaff);
router.patch('/staff/:id/toggle', protect, authorize('admin'), toggleStaffStatus);

module.exports = router;
