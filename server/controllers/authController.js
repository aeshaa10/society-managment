const crypto = require('crypto');
const User = require('../models/User');
const Member = require('../models/Member');
const { generateToken, generateResetToken } = require('../utils/generateToken');
const { success, error, created } = require('../utils/apiResponse');
const { createAuditLog } = require('../services/notificationService');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Please provide email and password', 400);
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return error(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) {
      return error(res, 'Your account has been deactivated. Contact the administrator.', 403);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Fetch member details if member role
    let memberData = null;
    if (user.role === 'member' && user.memberId) {
      memberData = await Member.findById(user.memberId).select('memberId fullName mobile');
    }

    const token = generateToken(user._id);

    await createAuditLog({
      performedBy: user._id,
      userRole: user.role,
      action: 'USER_LOGIN',
      targetModel: 'User',
      targetId: user._id,
      description: `${user.name} (${user.role}) logged in`,
      ipAddress: req.ip,
    });

    success(res, {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        memberId: user.memberId,
        memberData,
      },
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let memberData = null;
    if (user.role === 'member' && user.memberId) {
      memberData = await Member.findById(user.memberId);
    }
    success(res, { user, memberData });
  } catch (err) {
    next(err);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return error(res, 'Current password is incorrect', 400);
    }

    if (newPassword.length < 6) {
      return error(res, 'New password must be at least 6 characters', 400);
    }

    user.password = newPassword;
    await user.save();

    success(res, {}, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot password — generates reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal whether email exists
      return success(res, {}, 'If that email is registered, a reset link has been sent');
    }

    const resetToken = generateResetToken();
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // In production: send email with resetToken
    // For dev: return token in response
    success(res, {
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      message: 'Reset token generated',
    }, 'If that email is registered, a reset link has been sent');
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return error(res, 'Invalid or expired reset token', 400);
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    success(res, {}, 'Password has been reset successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Create staff account (Admin only)
// @route   POST /api/auth/create-staff
// @access  Admin
const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!['staff', 'admin'].includes(role)) {
      return error(res, 'Can only create staff or admin accounts', 400);
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return error(res, 'Email already in use', 400);
    }

    const user = await User.create({ name, email, password, role });

    await createAuditLog({
      performedBy: req.user._id,
      userRole: req.user.role,
      action: 'STAFF_CREATED',
      targetModel: 'User',
      targetId: user._id,
      description: `New staff account created: ${name} (${role})`,
      ipAddress: req.ip,
    });

    created(res, {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }, 'Staff account created successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Get all staff (Admin only)
// @route   GET /api/auth/staff
// @access  Admin
const getStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ role: { $in: ['staff', 'admin'] } }).select('-password').sort({ createdAt: -1 });
    success(res, { staff });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle staff active status
// @route   PATCH /api/auth/staff/:id/toggle
// @access  Admin
const toggleStaffStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return error(res, 'User not found', 404);
    if (user._id.toString() === req.user._id.toString()) {
      return error(res, 'Cannot deactivate your own account', 400);
    }
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    success(res, { isActive: user.isActive }, `Account ${user.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getMe, changePassword, forgotPassword, resetPassword, createStaff, getStaff, toggleStaffStatus };
