const Transaction = require('../models/Transaction');
const Member = require('../models/Member');
const { success, error, paginated } = require('../utils/apiResponse');

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Admin, Staff
const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, type = '', memberId = '', from = '', to = '', search = '' } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (type) query.type = type;

    if (memberId) {
      // memberId can be the MongoDB _id or the memberId string (MEM-XXXX)
      const member = await Member.findOne({
        $or: [{ _id: memberId }, { memberId: memberId }],
      });
      if (member) query.memberId = member._id;
    }

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    if (search) {
      const members = await Member.find({
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { memberId: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      query.memberId = { $in: members.map((m) => m._id) };
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('memberId', 'fullName memberId')
      .populate('recordedBy', 'name')
      .populate('loanId', 'loanId loanType');

    paginated(res, transactions, page, limit, total);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Auth
const getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('memberId', 'fullName memberId mobile')
      .populate('recordedBy', 'name')
      .populate('loanId', 'loanId loanType')
      .populate('accountId', 'accountNumber');
    if (!transaction) return error(res, 'Transaction not found', 404);
    success(res, { transaction });
  } catch (err) {
    next(err);
  }
};

// @desc    Get member's own transactions
// @route   GET /api/transactions/my
// @access  Member
const getMyTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 15 } = req.query;
    const skip = (page - 1) * limit;

    const query = { memberId: req.user.memberId };

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('recordedBy', 'name')
      .populate('loanId', 'loanId loanType');

    paginated(res, transactions, page, limit, total);
  } catch (err) {
    next(err);
  }
};

// @desc    Transaction dashboard stats
// @route   GET /api/transactions/stats
// @access  Admin, Staff
const getTransactionStats = async (req, res, next) => {
  try {
    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const formatted = {};
    stats.forEach((s) => {
      formatted[s._id] = { total: s.total, count: s.count };
    });

    success(res, { stats: formatted });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTransactions, getTransaction, getMyTransactions, getTransactionStats };
