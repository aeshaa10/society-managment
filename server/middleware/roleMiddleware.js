/**
 * Role-based authorization middleware factory.
 * Usage: authorize('admin'), authorize('admin', 'staff')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

/**
 * Middleware: member can only access their own data.
 * Pass memberIdParam = the req.params key containing memberId.
 */
const memberSelf = (memberIdParam = 'memberId') => {
  return (req, res, next) => {
    if (req.user.role === 'admin' || req.user.role === 'staff') return next();

    // For members: req.user.memberId is the linked Member ObjectId
    const targetId = req.params[memberIdParam];
    if (req.user.memberId && req.user.memberId.toString() === targetId) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'You can only access your own records',
    });
  };
};

module.exports = { authorize, memberSelf };
