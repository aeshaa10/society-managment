const Member = require('../models/Member');
const SavingsAccount = require('../models/SavingsAccount');
const Loan = require('../models/Loan');
const Installment = require('../models/Installment');
const Transaction = require('../models/Transaction');
const { success, error } = require('../utils/apiResponse');

// @desc    Overall dashboard summary
// @route   GET /api/reports/dashboard
// @access  Admin, Staff
const getDashboardSummary = async (req, res, next) => {
  try {
    // Members
    const totalMembers = await Member.countDocuments();
    const activeMembers = await Member.countDocuments({ status: 'active' });

    // Savings
    const savingsAgg = await SavingsAccount.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, totalBalance: { $sum: '$balance' } } },
    ]);
    const totalSavings = savingsAgg[0]?.totalBalance || 0;

    // Loans
    const totalLoansCount = await Loan.countDocuments();
    const pendingLoans = await Loan.countDocuments({ status: { $in: ['pending', 'under_review'] } });
    const loanAgg = await Loan.aggregate([
      { $match: { status: { $in: ['disbursed', 'closed'] } } },
      { $group: { _id: null, totalDisbursed: { $sum: '$disbursedAmount' }, totalOutstanding: { $sum: '$outstandingBalance' } } },
    ]);
    const totalDisbursed = loanAgg[0]?.totalDisbursed || 0;
    const totalOutstanding = loanAgg[0]?.totalOutstanding || 0;

    // Repayments
    const repaymentAgg = await Installment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, totalCollected: { $sum: '$paidAmount' } } },
    ]);
    const totalRepayments = repaymentAgg[0]?.totalCollected || 0;

    // Overdue
    const today = new Date();
    await Installment.updateMany({ status: 'pending', dueDate: { $lt: today } }, { $set: { status: 'overdue' } });
    const overdueCount = await Installment.countDocuments({ status: 'overdue' });

    // Recent transactions (last 10)
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('memberId', 'fullName memberId')
      .populate('recordedBy', 'name');

    // Recent members (last 5)
    const recentMembers = await Member.find().sort({ createdAt: -1 }).limit(5);

    // 6-month chart data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const depositChart = await Transaction.aggregate([
      { $match: { type: 'deposit', createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, total: { $sum: '$amount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const loanChart = await Loan.aggregate([
      { $match: { status: { $in: ['disbursed', 'closed'] }, disbursedDate: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$disbursedDate' }, month: { $month: '$disbursedDate' } }, total: { $sum: '$disbursedAmount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const repaymentChart = await Installment.aggregate([
      { $match: { status: 'paid', paidDate: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$paidDate' }, month: { $month: '$paidDate' } }, total: { $sum: '$paidAmount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Monthly data formatted for DashboardPage
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = {};
    depositChart.forEach((d) => {
      const mStr = `${months[d._id.month - 1]}`;
      monthlyMap[mStr] = monthlyMap[mStr] || { month: mStr, deposits: 0, repayments: 0, disbursements: 0 };
      monthlyMap[mStr].deposits = d.total;
    });
    repaymentChart.forEach((r) => {
      const mStr = `${months[r._id.month - 1]}`;
      monthlyMap[mStr] = monthlyMap[mStr] || { month: mStr, deposits: 0, repayments: 0, disbursements: 0 };
      monthlyMap[mStr].repayments = r.total;
    });
    loanChart.forEach((l) => {
      const mStr = `${months[l._id.month - 1]}`;
      monthlyMap[mStr] = monthlyMap[mStr] || { month: mStr, deposits: 0, repayments: 0, disbursements: 0 };
      monthlyMap[mStr].disbursements = l.total;
    });
    const monthlyData = Object.values(monthlyMap);

    // Loan status breakdown
    const loanStatusBreakdown = await Loan.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]);

    // Pending loan applications
    const pendingLoanList = await Loan.find({ status: { $in: ['pending', 'under_review'] } })
      .populate('memberId', 'fullName memberId')
      .sort({ applicationDate: -1 })
      .limit(5);

    success(res, {
      totalMembers,
      activeMembers,
      totalSavingsBalance: totalSavings,
      totalLoansCount,
      totalLoansDisbursed: totalDisbursed,
      outstandingBalance: totalOutstanding,
      totalRepayments,
      pendingLoans,
      recentTransactions,
      recentMembers,
      monthlyData,
      loanStatusBreakdown,
      summary: {
        totalMembers,
        activeMembers,
        totalSavings,
        pendingLoans,
        totalDisbursed,
        totalOutstanding,
        totalRepayments,
        overdueCount,
      },
      pendingLoanList,
      charts: { depositChart, loanChart, repaymentChart },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Loan report
// @route   GET /api/reports/loans
// @access  Admin, Staff
const getLoanReport = async (req, res, next) => {
  try {
    const { from, to, status, loanType } = req.query;
    const query = {};
    if (status) query.status = status;
    if (loanType) query.loanType = loanType;
    if (from || to) {
      query.applicationDate = {};
      if (from) query.applicationDate.$gte = new Date(from);
      if (to) query.applicationDate.$lte = new Date(to);
    }

    const loans = await Loan.find(query)
      .populate('memberId', 'fullName memberId')
      .populate('approvedBy', 'name')
      .sort({ applicationDate: -1 });

    const summary = await Loan.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$requestedAmount' } } },
    ]);

    success(res, { loans, summary });
  } catch (err) {
    next(err);
  }
};

// @desc    Transaction report
// @route   GET /api/reports/transactions
// @access  Admin, Staff
const getTransactionReport = async (req, res, next) => {
  try {
    const { from, to, type } = req.query;
    const query = {};
    if (type) query.type = type;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    const transactions = await Transaction.find(query)
      .populate('memberId', 'fullName memberId')
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 });

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const byType = {};
    transactions.forEach((t) => {
      byType[t.type] = (byType[t.type] || 0) + t.amount;
    });

    success(res, { transactions, totalAmount, byType });
  } catch (err) {
    next(err);
  }
};

// @desc    Outstanding loan report
// @route   GET /api/reports/outstanding
// @access  Admin, Staff
const getOutstandingReport = async (req, res, next) => {
  try {
    const loans = await Loan.find({ status: 'disbursed', outstandingBalance: { $gt: 0 } })
      .populate('memberId', 'fullName memberId mobile')
      .sort({ outstandingBalance: -1 });

    const totalOutstanding = loans.reduce((sum, l) => sum + l.outstandingBalance, 0);
    success(res, { loans, totalOutstanding, count: loans.length });
  } catch (err) {
    next(err);
  }
};

// @desc    Overdue installment report
// @route   GET /api/reports/overdue
// @access  Admin, Staff
const getOverdueReport = async (req, res, next) => {
  try {
    const today = new Date();
    await Installment.updateMany({ status: 'pending', dueDate: { $lt: today } }, { $set: { status: 'overdue' } });

    const installments = await Installment.find({ status: 'overdue' })
      .populate('memberId', 'fullName memberId mobile')
      .populate('loanId', 'loanId loanType')
      .sort({ dueDate: 1 });

    const totalOverdue = installments.reduce((sum, i) => sum + i.emiAmount, 0);
    success(res, { installments, totalOverdue, count: installments.length });
  } catch (err) {
    next(err);
  }
};

// @desc    Member registration report
// @route   GET /api/reports/members
// @access  Admin, Staff
const getMemberReport = async (req, res, next) => {
  try {
    const { from, to, status } = req.query;
    const query = {};
    if (status) query.status = status;
    if (from || to) {
      query.joiningDate = {};
      if (from) query.joiningDate.$gte = new Date(from);
      if (to) query.joiningDate.$lte = new Date(to);
    }

    const members = await Member.find(query).sort({ joiningDate: -1 });
    success(res, { members, count: members.length });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardSummary, getLoanReport, getTransactionReport, getOutstandingReport, getOverdueReport, getMemberReport };
