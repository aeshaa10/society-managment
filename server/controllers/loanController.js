const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Installment = require('../models/Installment');
const Transaction = require('../models/Transaction');
const Member = require('../models/Member');
const User = require('../models/User');
const SocietySettings = require('../models/SocietySettings');
const { calculateEMI, generateInstallmentSchedule } = require('../services/loanService');
const { createAuditLog, createNotification, notifyAdmins } = require('../services/notificationService');
const { success, created, error, paginated } = require('../utils/apiResponse');

// @desc    Get all loans
// @route   GET /api/loans
// @access  Admin, Staff
const getLoans = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status = '', search = '', loanType = '' } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;
    if (loanType) query.loanType = loanType;
    if (search) {
      const members = await Member.find({
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { memberId: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      query.memberId = { $in: members.map((m) => m._id) };
    }

    const total = await Loan.countDocuments(query);
    const loans = await Loan.find(query)
      .populate('memberId', 'fullName memberId mobile')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    paginated(res, loans, page, limit, total);
  } catch (err) {
    next(err);
  }
};

// @desc    Get member's own loans
// @route   GET /api/loans/my
// @access  Member
const getMyLoans = async (req, res, next) => {
  try {
    const loans = await Loan.find({ memberId: req.user.memberId })
      .sort({ createdAt: -1 });
    success(res, { loans });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single loan
// @route   GET /api/loans/:id
// @access  Auth
const getLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('memberId', 'fullName memberId mobile email')
      .populate('approvedBy', 'name')
      .populate('disbursedBy', 'name');
    if (!loan) return error(res, 'Loan not found', 404);

    // Members can only see their own loans
    if (req.user.role === 'member') {
      if (!req.user.memberId || req.user.memberId.toString() !== loan.memberId._id.toString()) {
        return error(res, 'Not authorized to view this loan', 403);
      }
    }

    success(res, { loan });
  } catch (err) {
    next(err);
  }
};

// @desc    Apply for loan (by member)
// @route   POST /api/loans
// @access  Member, Admin, Staff
const applyLoan = async (req, res, next) => {
  try {
    const { memberId, loanType, requestedAmount, tenureMonths, purpose } = req.body;

    // For member role: use their own memberId
    let targetMemberId = memberId;
    if (req.user.role === 'member') {
      targetMemberId = req.user.memberId;
    }

    if (!targetMemberId) return error(res, 'Member ID is required', 400);

    const member = await Member.findById(targetMemberId);
    if (!member) return error(res, 'Member not found', 404);
    if (member.status !== 'active') return error(res, 'Member account is not active', 400);

    // Get interest rate from settings
    const settings = await SocietySettings.findOne();
    let interestRate = settings?.defaultInterestRate || 12;

    if (settings?.loanTypes) {
      const loanTypeConfig = settings.loanTypes.find((lt) => lt.name === loanType);
      if (loanTypeConfig) interestRate = loanTypeConfig.defaultInterestRate;
    }

    const loan = await Loan.create({
      memberId: targetMemberId,
      loanType,
      requestedAmount: parseFloat(requestedAmount),
      interestRate,
      tenureMonths: parseInt(tenureMonths),
      purpose,
      applicationDate: new Date(),
    });

    // Notify admins
    await notifyAdmins({
      User,
      type: 'loan_applied',
      title: 'New Loan Application',
      message: `${member.fullName} (${member.memberId}) has applied for a ${loanType} loan of ₹${parseFloat(requestedAmount).toLocaleString('en-IN')}.`,
      relatedId: loan._id,
      relatedModel: 'Loan',
    });

    // Notify member
    if (member.userId) {
      await createNotification({
        recipientId: member.userId,
        type: 'loan_applied',
        title: 'Loan Application Submitted',
        message: `Your ${loanType} loan application for ₹${parseFloat(requestedAmount).toLocaleString('en-IN')} has been submitted and is under review.`,
        relatedId: loan._id,
        relatedModel: 'Loan',
      });
    }

    await createAuditLog({
      performedBy: req.user._id,
      userRole: req.user.role,
      action: 'LOAN_APPLIED',
      targetModel: 'Loan',
      targetId: loan._id,
      description: `Loan application by ${member.fullName}: ₹${requestedAmount} (${loanType})`,
      ipAddress: req.ip,
    });

    created(res, { loan }, 'Loan application submitted successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Approve loan
// @route   PATCH /api/loans/:id/approve
// @access  Admin
const approveLoan = async (req, res, next) => {
  try {
    const { approvedAmount, remarks = '' } = req.body;
    const loan = await Loan.findById(req.params.id).populate('memberId');

    if (!loan) return error(res, 'Loan not found', 404);
    if (!['pending', 'under_review'].includes(loan.status)) {
      return error(res, `Cannot approve a loan with status: ${loan.status}`, 400);
    }

    const finalAmount = parseFloat(approvedAmount) || loan.requestedAmount;
    const { emi, totalRepayable, totalInterest } = calculateEMI(finalAmount, loan.interestRate, loan.tenureMonths);

    loan.approvedAmount = finalAmount;
    loan.emi = emi;
    loan.totalRepayable = totalRepayable;
    loan.totalInterest = totalInterest;
    loan.outstandingBalance = finalAmount;
    loan.status = 'approved';
    loan.approvedBy = req.user._id;
    loan.approvedDate = new Date();
    loan.remarks = remarks;
    await loan.save();

    // Notify member
    const member = loan.memberId;
    if (member.userId) {
      await createNotification({
        recipientId: member.userId,
        type: 'loan_approved',
        title: 'Loan Application Approved! 🎉',
        message: `Your ${loan.loanType} loan has been approved for ₹${finalAmount.toLocaleString('en-IN')}. EMI: ₹${emi.toLocaleString('en-IN')}/month for ${loan.tenureMonths} months.`,
        relatedId: loan._id,
        relatedModel: 'Loan',
      });
    }

    await createAuditLog({
      performedBy: req.user._id,
      userRole: req.user.role,
      action: 'LOAN_APPROVED',
      targetModel: 'Loan',
      targetId: loan._id,
      description: `Loan ${loan.loanId} approved for ₹${finalAmount} (${member.fullName})`,
      metadata: { approvedAmount: finalAmount, emi },
      ipAddress: req.ip,
    });

    success(res, { loan }, 'Loan approved successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Reject loan
// @route   PATCH /api/loans/:id/reject
// @access  Admin
const rejectLoan = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    if (!remarks) return error(res, 'Rejection remarks are required', 400);

    const loan = await Loan.findById(req.params.id).populate('memberId');
    if (!loan) return error(res, 'Loan not found', 404);
    if (!['pending', 'under_review'].includes(loan.status)) {
      return error(res, `Cannot reject a loan with status: ${loan.status}`, 400);
    }

    loan.status = 'rejected';
    loan.remarks = remarks;
    loan.approvedBy = req.user._id;
    loan.approvedDate = new Date();
    await loan.save();

    const member = loan.memberId;
    if (member.userId) {
      await createNotification({
        recipientId: member.userId,
        type: 'loan_rejected',
        title: 'Loan Application Update',
        message: `Your ${loan.loanType} loan application has been reviewed. Reason: ${remarks}`,
        relatedId: loan._id,
        relatedModel: 'Loan',
      });
    }

    await createAuditLog({
      performedBy: req.user._id,
      userRole: req.user.role,
      action: 'LOAN_REJECTED',
      targetModel: 'Loan',
      targetId: loan._id,
      description: `Loan ${loan.loanId} rejected. Reason: ${remarks}`,
      ipAddress: req.ip,
    });

    success(res, { loan }, 'Loan rejected');
  } catch (err) {
    next(err);
  }
};

// @desc    Disburse loan (generate installment schedule)
// @route   POST /api/loans/:id/disburse
// @access  Admin
const disburseLoan = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { paymentMethod = 'cash', referenceNumber = '' } = req.body;

    const loan = await Loan.findById(req.params.id).populate('memberId').session(session);
    if (!loan) {
      await session.abortTransaction();
      return error(res, 'Loan not found', 404);
    }
    if (loan.status !== 'approved') {
      await session.abortTransaction();
      return error(res, 'Only approved loans can be disbursed', 400);
    }

    // Update loan
    loan.status = 'disbursed';
    loan.disbursedAmount = loan.approvedAmount;
    loan.disbursedDate = new Date();
    loan.disbursedBy = req.user._id;
    loan.outstandingBalance = loan.approvedAmount;
    await loan.save({ session });

    // Generate installment schedule (first EMI due next month)
    const schedule = generateInstallmentSchedule(
      loan.approvedAmount,
      loan.interestRate,
      loan.tenureMonths,
      new Date() // disbursement date
    );

    const installmentDocs = schedule.map((inst) => ({
      loanId: loan._id,
      memberId: loan.memberId._id,
      ...inst,
    }));

    await Installment.insertMany(installmentDocs, { session });

    // Create disbursement transaction
    const transaction = await Transaction.create(
      [{
        memberId: loan.memberId._id,
        loanId: loan._id,
        type: 'loan_disbursement',
        amount: loan.approvedAmount,
        paymentMethod,
        referenceNumber,
        description: `Loan disbursement for ${loan.loanId}`,
        recordedBy: req.user._id,
      }],
      { session }
    );

    await session.commitTransaction();

    // Notifications & audit (outside transaction)
    const member = loan.memberId;
    if (member.userId) {
      await createNotification({
        recipientId: member.userId,
        type: 'loan_disbursed',
        title: 'Loan Amount Disbursed! 💰',
        message: `Your loan of ₹${loan.approvedAmount.toLocaleString('en-IN')} (${loan.loanId}) has been disbursed. First EMI of ₹${loan.emi.toLocaleString('en-IN')} is due on ${schedule[0].dueDate.toLocaleDateString('en-IN')}.`,
        relatedId: loan._id,
        relatedModel: 'Loan',
      });
    }

    await createAuditLog({
      performedBy: req.user._id,
      userRole: req.user.role,
      action: 'LOAN_DISBURSED',
      targetModel: 'Loan',
      targetId: loan._id,
      description: `Loan ${loan.loanId} disbursed: ₹${loan.approvedAmount} to ${member.fullName}`,
      metadata: { amount: loan.approvedAmount, installmentsGenerated: schedule.length },
      ipAddress: req.ip,
    });

    success(res, { loan, installmentsGenerated: schedule.length, transaction: transaction[0] }, 'Loan disbursed successfully');
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// @desc    EMI Calculator (no auth needed)
// @route   POST /api/loans/calculate
// @access  Public
const calculateLoan = async (req, res, next) => {
  try {
    // Accept both field name conventions
    const principal = parseFloat(req.body.principal || req.body.amount);
    const interestRate = parseFloat(req.body.interestRate || req.body.annualRate);
    const tenureMonths = parseInt(req.body.tenureMonths);

    if (!principal || isNaN(principal) || !interestRate || isNaN(interestRate) || !tenureMonths || isNaN(tenureMonths)) {
      return error(res, 'Please provide principal (or amount), interestRate (or annualRate), and tenureMonths', 400);
    }

    const result = calculateEMI(principal, interestRate, tenureMonths);
    const schedule = generateInstallmentSchedule(principal, interestRate, tenureMonths, new Date());

    success(res, { ...result, principal, interestRate, tenureMonths, schedule });
  } catch (err) {
    next(err);
  }
};

// @desc    Get loan stats for dashboard
// @route   GET /api/loans/stats
// @access  Admin, Staff
const getLoanStats = async (req, res, next) => {
  try {
    const totalLoans = await Loan.countDocuments();
    const pending = await Loan.countDocuments({ status: { $in: ['pending', 'under_review'] } });
    const disbursed = await Loan.countDocuments({ status: 'disbursed' });
    const closed = await Loan.countDocuments({ status: 'closed' });

    const disbursedAgg = await Loan.aggregate([
      { $match: { status: { $in: ['disbursed', 'closed'] } } },
      { $group: { _id: null, totalDisbursed: { $sum: '$disbursedAmount' }, totalOutstanding: { $sum: '$outstandingBalance' } } },
    ]);

    const { totalDisbursed = 0, totalOutstanding = 0 } = disbursedAgg[0] || {};

    // Monthly loan trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrend = await Loan.aggregate([
      { $match: { status: { $in: ['disbursed', 'closed'] }, disbursedDate: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$disbursedDate' }, month: { $month: '$disbursedDate' } }, total: { $sum: '$disbursedAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    success(res, { totalLoans, pending, disbursed, closed, totalDisbursed, totalOutstanding, monthlyTrend });
  } catch (err) {
    next(err);
  }
};

// @desc    Get installment schedule for a loan
// @route   GET /api/loans/:id/schedule
// @access  Auth
const getLoanSchedule = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return error(res, 'Loan not found', 404);

    const installments = await Installment.find({ loanId: loan._id }).sort({ installmentNumber: 1 }).populate('transactionId', 'transactionId paymentMethod');
    success(res, { loan, installments });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLoans, getMyLoans, getLoan, applyLoan, approveLoan, rejectLoan, disburseLoan, calculateLoan, getLoanStats, getLoanSchedule };
