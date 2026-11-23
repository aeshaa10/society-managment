const AuditLog = require('../models/AuditLog');
const { success, paginated } = require('../utils/apiResponse');

// @desc    Get all audit logs
// @route   GET /api/audit
// @access  Admin only
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action = '', from = '', to = '' } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (action) query.action = { $regex: action, $options: 'i' };
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('performedBy', 'name email role');

    paginated(res, logs, page, limit, total);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAuditLogs };
