const Member = require('../models/Member');
const User = require('../models/User');
const SavingsAccount = require('../models/SavingsAccount');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const { success, created, error, paginated } = require('../utils/apiResponse');
const { createAuditLog, createNotification, notifyAdmins } = require('../services/notificationService');

// @desc    Get all members
// @route   GET /api/members
// @access  Admin, Staff
const getMembers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { memberId: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;

    const total = await Member.countDocuments(query);
    const members = await Member.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    paginated(res, members, page, limit, total);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single member
// @route   GET /api/members/:id
// @access  Admin, Staff, Member(self)
const getMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id).populate('userId', 'email isActive lastLogin');
    if (!member) return error(res, 'Member not found', 404);

    // Fetch savings account
    const savingsAccount = await SavingsAccount.findOne({ memberId: member._id });

    // Fetch loan summary
    const loans = await Loan.find({ memberId: member._id }).select('loanId loanType status requestedAmount approvedAmount outstandingBalance applicationDate');

    success(res, { member, savingsAccount, loans });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new member
// @route   POST /api/members
// @access  Admin
const createMember = async (req, res, next) => {
  try {
    const { fullName, dateOfBirth, gender, mobile, email, address, city, occupation, joiningDate, nomineeDetails } = req.body;

    // Check duplicate mobile
    const existingMobile = await Member.findOne({ mobile });
    if (existingMobile) return error(res, 'A member with this mobile number already exists', 400);

    // Check duplicate email if provided
    if (email) {
      const existingEmail = await Member.findOne({ email });
      if (existingEmail) return error(res, 'A member with this email already exists', 400);
    }

    // Create member
    const member = await Member.create({
      fullName, dateOfBirth, gender, mobile, email, address, city, occupation,
      joiningDate: joiningDate || new Date(),
      nomineeDetails,
    });

    // Create linked user account for the member
    const tempPassword = `Member@${member.memberId}`;
    const memberUser = await User.create({
      name: fullName,
      email: email || `${member.memberId.toLowerCase().replace('-', '')}@sahyog.local`,
      password: tempPassword,
      role: 'member',
      memberId: member._id,
    });

    // Link user to member
    member.userId = memberUser._id;
    await member.save();

    // Auto-create savings account
    const savingsAccount = await SavingsAccount.create({ memberId: member._id });

    // Audit log
    await createAuditLog({
      performedBy: req.user._id,
      userRole: req.user.role,
      action: 'MEMBER_CREATED',
      targetModel: 'Member',
      targetId: member._id,
      description: `New member registered: ${fullName} (${member.memberId})`,
      ipAddress: req.ip,
    });

    // Notify admins
    await notifyAdmins({
      User,
      type: 'member_registered',
      title: 'New Member Registered',
      message: `${fullName} has been registered as a new member (${member.memberId}).`,
      relatedId: member._id,
      relatedModel: 'Member',
    });

    // Notify the member
    await createNotification({
      recipientId: memberUser._id,
      type: 'member_registered',
      title: 'Welcome to Sahyog Co-operative Society!',
      message: `Your membership has been registered. Your Member ID is ${member.memberId}. Your login credentials have been created.`,
      relatedId: member._id,
      relatedModel: 'Member',
    });

    created(res, {
      member,
      savingsAccount,
      loginCredentials: {
        email: memberUser.email,
        tempPassword,
        note: 'Please ask the member to change this password after first login',
      },
    }, 'Member registered successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Update member
// @route   PUT /api/members/:id
// @access  Admin
const updateMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return error(res, 'Member not found', 404);

    const allowedFields = ['fullName', 'dateOfBirth', 'gender', 'mobile', 'email', 'address', 'city', 'occupation', 'nomineeDetails'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) member[field] = req.body[field];
    });

    const updated = await member.save();

    await createAuditLog({
      performedBy: req.user._id,
      userRole: req.user.role,
      action: 'MEMBER_UPDATED',
      targetModel: 'Member',
      targetId: member._id,
      description: `Member updated: ${member.fullName} (${member.memberId})`,
      ipAddress: req.ip,
    });

    success(res, { member: updated }, 'Member updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle member status (activate/deactivate)
// @route   PATCH /api/members/:id/status
// @access  Admin
const toggleMemberStatus = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return error(res, 'Member not found', 404);

    member.status = member.status === 'active' ? 'inactive' : 'active';
    await member.save();

    // Also toggle their user account
    if (member.userId) {
      await User.findByIdAndUpdate(member.userId, { isActive: member.status === 'active' });
    }

    await createAuditLog({
      performedBy: req.user._id,
      userRole: req.user.role,
      action: member.status === 'active' ? 'MEMBER_ACTIVATED' : 'MEMBER_DEACTIVATED',
      targetModel: 'Member',
      targetId: member._id,
      description: `Member ${member.status}: ${member.fullName} (${member.memberId})`,
      ipAddress: req.ip,
    });

    success(res, { status: member.status }, `Member ${member.status} successfully`);
  } catch (err) {
    next(err);
  }
};

// @desc    Get member financial statement
// @route   GET /api/members/:id/statement
// @access  Admin, Staff, Member(self)
const getMemberStatement = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return error(res, 'Member not found', 404);

    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);

    const txnQuery = { memberId: member._id };
    if (from || to) txnQuery.createdAt = dateFilter;

    const transactions = await Transaction.find(txnQuery)
      .sort({ createdAt: -1 })
      .populate('recordedBy', 'name');

    const savingsAccount = await SavingsAccount.findOne({ memberId: member._id });
    const loans = await Loan.find({ memberId: member._id }).select('loanId loanType status outstandingBalance approvedAmount');

    success(res, { member, savingsAccount, loans, transactions });
  } catch (err) {
    next(err);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/members/stats
// @access  Admin, Staff
const getMemberStats = async (req, res, next) => {
  try {
    const total = await Member.countDocuments();
    const active = await Member.countDocuments({ status: 'active' });
    const inactive = await Member.countDocuments({ status: 'inactive' });
    const thisMonth = await Member.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    });

    success(res, { total, active, inactive, thisMonth });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMembers, getMember, createMember, updateMember, toggleMemberStatus, getMemberStatement, getMemberStats };
