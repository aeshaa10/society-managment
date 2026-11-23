const Member = require('../models/Member');
const SavingsAccount = require('../models/SavingsAccount');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');

// Helper to get month-year string
const getMonthYear = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private (admin and staff)
const getDashboard = async (req, res, next) => {
  try {
    // Total members and active members
    const totalMembersPromise = Member.countDocuments();
    const activeMembersPromise = Member.countDocuments({ status: 'active' });

    // Total savings balance (sum of all account balances)
    const totalSavingsAgg = SavingsAccount.aggregate([
      { $group: { _id: null, totalBalance: { $sum: '$balance' } } },
    ]);

    // Loan aggregates
    const loansAgg = Loan.aggregate([
      {
        $group: {
          _id: null,
          totalLoansCount: { $sum: 1 },
          totalLoansDisbursed: { $sum: { $ifNull: ['$disbursedAmount', 0] } },
          outstandingBalance: { $sum: { $ifNull: ['$outstandingBalance', 0] } },
          pendingLoans: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        },
      },
    ]);

    // Repayments total (transactions of type loan_repayment)
    const repaymentsAgg = Transaction.aggregate([
      { $match: { type: 'loan_repayment' } },
      { $group: { _id: null, totalRepayments: { $sum: '$amount' } } },
    ]);

    // Recent transactions (last 6)
    const recentTransactionsPromise = Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('memberId', 'fullName')
      .lean();

    // Recent members (last 5)
    const recentMembersPromise = Member.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Monthly data for deposits, repayments, disbursements (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    const monthlyDataPromise = Transaction.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $project: {
          month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          amount: 1,
          type: 1,
        },
      },
      {
        $group: {
          _id: { month: '$month', type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      {
        $group: {
          _id: '$_id.month',
          data: {
            $push: { k: '$_id.type', v: '$total' },
          },
        },
      },
      {
        $addFields: {
          month: '$_id',
          deposits: { $ifNull: [{ $arrayElemAt: [{ $filter: { input: '$data', as: 'd', cond: { $eq: ['$$d.k', 'deposit'] } } }, 0] }, 0] },
          repayments: { $ifNull: [{ $arrayElemAt: [{ $filter: { input: '$data', as: 'd', cond: { $eq: ['$$d.k', 'loan_repayment'] } } }, 0] }, 0] },
          disbursements: { $ifNull: [{ $arrayElemAt: [{ $filter: { input: '$data', as: 'd', cond: { $eq: ['$$d.k', 'loan_disbursement'] } } }, 0] }, 0] },
        },
      },
      {
        $project: {
          _id: 0,
          month: 1,
          deposits: { $ifNull: ['$deposits.v', 0] },
          repayments: { $ifNull: ['$repayments.v', 0] },
          disbursements: { $ifNull: ['$disbursements.v', 0] },
        },
      },
      { $sort: { month: 1 } },
    ]);

    // Loan status breakdown
    const loanStatusBreakdownPromise = Loan.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]);

    const [
      totalMembers,
      activeMembers,
      totalSavingsAggResult,
      loansAggResult,
      repaymentsAggResult,
      recentTransactions,
      recentMembers,
      monthlyData,
      loanStatusBreakdown,
    ] = await Promise.all([
      totalMembersPromise,
      activeMembersPromise,
      totalSavingsAgg,
      loansAgg,
      repaymentsAgg,
      recentTransactionsPromise,
      recentMembersPromise,
      monthlyDataPromise,
      loanStatusBreakdownPromise,
    ]);

    const totalSavingsBalance = totalSavingsAggResult[0]?.totalBalance || 0;
    const {
      totalLoansCount = 0,
      totalLoansDisbursed = 0,
      outstandingBalance = 0,
      pendingLoans = 0,
    } = loansAggResult[0] || {};
    const totalRepayments = repaymentsAggResult[0]?.totalRepayments || 0;

    const data = {
      totalMembers,
      activeMembers,
      totalSavingsBalance,
      totalLoansCount,
      totalLoansDisbursed,
      outstandingBalance,
      totalRepayments,
      pendingLoans,
      recentTransactions,
      recentMembers,
      monthlyData,
      loanStatusBreakdown,
    };

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
