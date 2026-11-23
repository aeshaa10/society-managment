const mongoose = require('mongoose');
const Installment = require('../models/Installment');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const Member = require('../models/Member');
const { success, error, paginated } = require('../utils/apiResponse');
const { createAuditLog, createNotification } = require('../services/notificationService');

// @desc    Get installments for a loan
// @route   GET /api/installments/loan/:loanId
// @access  Auth
const getInstallmentsByLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.loanId);
    if (!loan) return error(res, 'Loan not found', 404);

    // Auto-mark overdue installments
    const today = new Date();
    await Installment.updateMany(
      { loanId: loan._id, status: 'pending', dueDate: { $lt: today } },
      { $set: { status: 'overdue' } }
    );

    const installments = await Installment.find({ loanId: loan._id })
      .sort({ installmentNumber: 1 })
      .populate('transactionId', 'transactionId paymentMethod createdAt')
      .populate('recordedBy', 'name');

    success(res, { installments, loan });
  } catch (err) {
    next(err);
  }
};

// @desc    Record installment payment
// @route   POST /api/installments/:id/pay
// @access  Admin, Staff
const payInstallment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { paymentMethod = 'cash', referenceNumber = '', paidAmount } = req.body;

    const installment = await Installment.findById(req.params.id).session(session);
    if (!installment) {
      await session.abortTransaction();
      return error(res, 'Installment not found', 404);
    }

    if (installment.status === 'paid') {
      await session.abortTransaction();
      return error(res, 'This installment has already been paid', 400);
    }

    if (installment.status === 'waived') {
      await session.abortTransaction();
      return error(res, 'This installment has been waived', 400);
    }

    const loan = await Loan.findById(installment.loanId).session(session);
    if (!loan) {
      await session.abortTransaction();
      return error(res, 'Loan not found', 404);
    }

    if (loan.status === 'closed') {
      await session.abortTransaction();
      return error(res, 'Loan is already closed', 400);
    }

    const amountPaid = parseFloat(paidAmount) || installment.emiAmount;

    // Create transaction record
    const transaction = await Transaction.create(
      [{
        memberId: installment.memberId,
        loanId: installment.loanId,
        installmentId: installment._id,
        type: 'loan_repayment',
        amount: amountPaid,
        paymentMethod,
        referenceNumber,
        description: `EMI #${installment.installmentNumber} for loan ${loan.loanId}`,
        recordedBy: req.user._id,
      }],
      { session }
    );

    // Update installment
    installment.status = 'paid';
    installment.paidDate = new Date();
    installment.paidAmount = amountPaid;
    installment.paymentMethod = paymentMethod;
    installment.transactionId = transaction[0]._id;
    installment.recordedBy = req.user._id;
    await installment.save({ session });

    // Update loan outstanding balance
    loan.outstandingBalance = Math.max(0, loan.outstandingBalance - installment.principalComponent);

    // Check if all installments are paid → close loan
    const unpaidCount = await Installment.countDocuments({
      loanId: loan._id,
      status: { $in: ['pending', 'overdue'] },
    }).session(session);

    if (unpaidCount === 0) {
      loan.status = 'closed';
      loan.closedDate = new Date();
      loan.outstandingBalance = 0;
    }

    await loan.save({ session });
    await session.commitTransaction();

    // Notifications & audit (outside session)
    const member = await Member.findById(installment.memberId);

    await createAuditLog({
      performedBy: req.user._id,
      userRole: req.user.role,
      action: 'REPAYMENT_RECORDED',
      targetModel: 'Installment',
      targetId: installment._id,
      description: `EMI #${installment.installmentNumber} paid for ${loan.loanId} (${member?.fullName}): ₹${amountPaid}`,
      metadata: { amountPaid, loanId: loan.loanId, installmentNumber: installment.installmentNumber },
      ipAddress: req.ip,
    });

    if (member?.userId) {
      const isLoanClosed = loan.status === 'closed';
      await createNotification({
        recipientId: member.userId,
        type: 'repayment_recorded',
        title: isLoanClosed ? '🎉 Loan Fully Repaid!' : 'EMI Payment Recorded',
        message: isLoanClosed
          ? `Congratulations! Your loan ${loan.loanId} has been fully repaid.`
          : `EMI #${installment.installmentNumber} of ₹${amountPaid.toLocaleString('en-IN')} for loan ${loan.loanId} has been recorded. Outstanding balance: ₹${loan.outstandingBalance.toLocaleString('en-IN')}.`,
        relatedId: loan._id,
        relatedModel: 'Loan',
      });
    }

    success(res, {
      installment,
      transaction: transaction[0],
      loan: { status: loan.status, outstandingBalance: loan.outstandingBalance },
    }, 'Installment payment recorded successfully');
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// @desc    Get all overdue installments
// @route   GET /api/installments/overdue
// @access  Admin, Staff
const getOverdueInstallments = async (req, res, next) => {
  try {
    const today = new Date();

    // Update overdue status first
    await Installment.updateMany(
      { status: 'pending', dueDate: { $lt: today } },
      { $set: { status: 'overdue' } }
    );

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const total = await Installment.countDocuments({ status: 'overdue' });
    const installments = await Installment.find({ status: 'overdue' })
      .populate('loanId', 'loanId loanType')
      .populate('memberId', 'fullName memberId mobile')
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    paginated(res, installments, page, limit, total);
  } catch (err) {
    next(err);
  }
};

// @desc    Get upcoming dues (next 30 days)
// @route   GET /api/installments/upcoming
// @access  Admin, Staff
const getUpcomingInstallments = async (req, res, next) => {
  try {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const installments = await Installment.find({
      status: 'pending',
      dueDate: { $gte: today, $lte: thirtyDaysLater },
    })
      .populate('loanId', 'loanId loanType')
      .populate('memberId', 'fullName memberId mobile')
      .sort({ dueDate: 1 })
      .limit(50);

    success(res, { installments });
  } catch (err) {
    next(err);
  }
};

// @desc    Get repayment stats for dashboard
// @route   GET /api/installments/stats
// @access  Admin, Staff
const getRepaymentStats = async (req, res, next) => {
  try {
    const today = new Date();
    await Installment.updateMany(
      { status: 'pending', dueDate: { $lt: today } },
      { $set: { status: 'overdue' } }
    );

    const totalPaid = await Installment.countDocuments({ status: 'paid' });
    const totalOverdue = await Installment.countDocuments({ status: 'overdue' });
    const totalPending = await Installment.countDocuments({ status: 'pending' });

    const repaidAgg = await Installment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, totalCollected: { $sum: '$paidAmount' } } },
    ]);

    const totalCollected = repaidAgg[0]?.totalCollected || 0;

    // Monthly repayment trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrend = await Installment.aggregate([
      { $match: { status: 'paid', paidDate: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$paidDate' }, month: { $month: '$paidDate' } }, total: { $sum: '$paidAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    success(res, { totalPaid, totalOverdue, totalPending, totalCollected, monthlyTrend });
  } catch (err) {
    next(err);
  }
};

module.exports = { getInstallmentsByLoan, payInstallment, getOverdueInstallments, getUpcomingInstallments, getRepaymentStats };
