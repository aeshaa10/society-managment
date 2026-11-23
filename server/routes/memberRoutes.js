const express = require('express');
const router = express.Router();
const { getMembers, getMember, createMember, updateMember, toggleMemberStatus, getMemberStatement, getMemberStats } = require('../controllers/memberController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/stats', authorize('admin', 'staff'), getMemberStats);
router.get('/', authorize('admin', 'staff'), getMembers);
router.post('/', authorize('admin'), createMember);
router.get('/:id', authorize('admin', 'staff', 'member'), getMember);
router.put('/:id', authorize('admin'), updateMember);
router.patch('/:id/status', authorize('admin'), toggleMemberStatus);
router.get('/:id/statement', authorize('admin', 'staff', 'member'), getMemberStatement);

module.exports = router;
