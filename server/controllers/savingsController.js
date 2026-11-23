const mongoose = require('mongoose');
const SavingsAccount = require('../models/SavingsAccount');
const Transaction = require('../models/Transaction');
const Member = require('../models/Member');
const { success, error, paginated } = require('../utils/apiResponse');
const { createAuditLog, createNotification } = require('../services/notificationService');

// @desc    Get all savings accounts
// @route   GET /api/savings
// @access  Admin, Staff
const getAccounts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    let matchQuery = {};
    if (search) {
      const members = await Member.find({
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { memberId: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      matchQuery.memberId = { $in: members.map((m) => m._id) };
    }

    const total = await SavingsAccount.countDocuments(matchQuery);
    const accounts = await SavingsAccount.find(matchQuery)
      .populate('memberId', 'fullName memberId mobile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    paginated(res, accounts, page, limit, total);
  } catch (err) {
    next(err);
  }
};

// @desc    Get one member's savings account
// @route   GET /api/savings/member/:memberId
// @access  Admin, Staff, Member(self)
const getAccountByMember = async (req, res, next) => {
  try {
    const account = await SavingsAccount.findOne({ memberId: req.params.memberId }).populate('memberId', 'fullName memberId');
    if (!account) return error(res, 'Savings account not found', 404);
    success(res, { account });
  } catch (err) {
    next(err);
  }
};

// @desc    Deposit money
// @route   POST /api/savings/:id/deposit
// @access  Admin, Staff
const deposit = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { amount, paymentMethod = 'cash', referenceNumber = '', description = '' } = req.body;

    if (!amount || amount <= 0) {
      await session.abortTransaction();
      return error(res, 'Invalid deposit amount', 400);
    }

    const account = await SavingsAccount.findById(req.params.id).session(session);
    if (!account) {
      await session.abortTransaction();
      return error(res, 'Account not found', 404);
    }

    if (account.status !== 'active') {
      await session.abortTransaction();
      return error(res, 'Account is not active', 400);
    }

    const balanceBefore = account.balance;
    account.balance += parseFloat(amount);
    await account.save({ session });

    // Create transaction record
    const transaction = await Transaction.create(
      [{
        memberId: account.memberId,
        accountId: account._id,
        type: 'deposit',
        amount: parseFloat(amount),
        balanceBefore,
        balanceAfter: account.balance,
        paymentMethod,
        referenceNumber,
        description: description || `Deposit to account ${account.accountNumber}`,
        recordedBy: req.user._id,
      }],
      { session }
    );

    await session.commitTransaction();

    // Audit log (outside session)
    const member = await Member.findById(account.memberId);
    await createAuditLog({
      performedBy: req.user._id,
      userRole: req.user.role,
      action: 'DEPOSIT_MADE',
      targetModel: 'SavingsAccount',
      targetId: account._id,
      description: `Deposit of ₹${amount} to ${account.accountNumber} (${member?.fullName})`,
      metadata: { amount, balanceBefore, balanceAfter: account.balance },
      ipAddress: req.ip,
    });

    // Notify member
    if (member?.userId) {
      await createNotification({
        recipientId: member.userId,
        type: 'deposit_made',
        title: 'Deposit Successful',
        message: `₹${parseFloat(amount).toLocaleString('en-IN')} has been deposited to your savings account. New balance: ₹${account.balance.toLocaleString('en-IN')}.`,
        relatedId: transaction[0]._id,
        relatedModel: 'Transaction',
      });
    }

    success(res, {
      account,
      transaction: transaction[0],
    }, 'Deposit recorded successfully');
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// @desc    Withdraw money
// @route   POST /api/savings/:id/withdraw
// @access  Admin, Staff
const withdraw = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { amount, paymentMethod = 'cash', referenceNumber = '', description = '' } = req.body;

    if (!amount || amount <= 0) {
      await session.abortTransaction();
      return error(res, 'Invalid withdrawal amount', 400);
    }

    const account = await SavingsAccount.findById(req.params.id).session(session);
    if (!account) {
      await session.abortTransaction();
      return error(res, 'Account not found', 404);
    }

    if (account.status !== 'active') {
      await session.abortTransaction();
      return error(res, 'Account is not active', 400);
    }

    // Server-side balance validation
    const availableBalance = account.balance - account.minimumBalance;
    if (parseFloat(amount) > availableBalance) {
      await session.abortTransaction();
      return error(res, `Insufficient balance. Available for withdrawal: ₹${availableBalance.toLocaleString('en-IN')} (minimum balance ₹${account.minimumBalance} must be maintained)`, 400);
    }

    const balanceBefore = account.balance;
    account.balance -= parseFloat(amount);
    await account.save({ session });

    const transaction = await Transaction.create(
      [{
        memberId: account.memberId,
        accountId: account._id,
        type: 'withdrawal',
        amount: parseFloat(amount),
        balanceBefore,
        balanceAfter: account.balance,
        paymentMethod,
        referenceNumber,
        description: description || `Withdrawal from account ${account.accountNumber}`,
        recordedBy: req.user._id,
      }],
      { session }
    );

    await session.commitTransaction();

    const member = await Member.findById(account.memberId);
    await createAuditLog({
      performedBy: req.user._id,
      userRole: req.user.role,
      action: 'WITHDRAWAL_MADE',
      targetModel: 'SavingsAccount',
      targetId: account._id,
      description: `Withdrawal of ₹${amount} from ${account.accountNumber} (${member?.fullName})`,
      metadata: { amount, balanceBefore, balanceAfter: account.balance },
      ipAddress: req.ip,
    });

    if (member?.userId) {
      await createNotification({
        recipientId: member.userId,
        type: 'withdrawal_made',
        title: 'Withdrawal Processed',
        message: `₹${parseFloat(amount).toLocaleString('en-IN')} has been withdrawn from your savings account. New balance: ₹${account.balance.toLocaleString('en-IN')}.`,
        relatedId: transaction[0]._id,
        relatedModel: 'Transaction',
      });
    }

    success(res, { account, transaction: transaction[0] }, 'Withdrawal recorded successfully');
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// @desc    Get account transactions
// @route   GET /api/savings/:id/transactions
// @access  Admin, Staff, Member(self)
const getAccountTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const account = await SavingsAccount.findById(req.params.id);
    if (!account) return error(res, 'Account not found', 404);

    const total = await Transaction.countDocuments({ accountId: account._id });
    const transactions = await Transaction.find({ accountId: account._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('recordedBy', 'name');

    paginated(res, transactions, page, limit, total);
  } catch (err) {
    next(err);
  }
};

// @desc    Get savings dashboard stats
// @route   GET /api/savings/stats
// @access  Admin, Staff
const getSavingsStats = async (req, res, next) => {
  try {
    const accountCount = await SavingsAccount.countDocuments({ status: 'active' });

    const result = await SavingsAccount.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          totalSavings: { $sum: '$balance' },
        },
      },
    ]);

    const totalSavings = result[0]?.totalSavings || 0;

    const depositAgg = await Transaction.aggregate([
      { $match: { type: 'deposit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const withdrawalAgg = await Transaction.aggregate([
      { $match: { type: 'withdrawal' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalDeposits = depositAgg[0]?.total || 0;
    const totalWithdrawals = withdrawalAgg[0]?.total || 0;

    // Monthly deposit trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const depositTrend = await Transaction.aggregate([
      { $match: { type: 'deposit', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    success(res, { totalSavings, totalDeposits, totalWithdrawals, accountCount, depositTrend });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAccounts, getAccountByMember, deposit, withdraw, getAccountTransactions, getSavingsStats };
