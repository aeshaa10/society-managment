const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

/**
 * Create a notification for a user
 */
const createNotification = async ({ recipientId, type, title, message, relatedId = null, relatedModel = null }) => {
  try {
    await Notification.create({ recipientId, type, title, message, relatedId, relatedModel });
  } catch (err) {
    console.error('Notification creation failed:', err.message);
  }
};

/**
 * Create an audit log entry
 */
const createAuditLog = async ({ performedBy, userRole, action, targetModel, targetId, description, metadata = {}, ipAddress = '' }) => {
  try {
    await AuditLog.create({ performedBy, userRole, action, targetModel, targetId, description, metadata, ipAddress });
  } catch (err) {
    console.error('Audit log creation failed:', err.message);
  }
};

/**
 * Helper: notify all admins about an event
 */
const notifyAdmins = async ({ User, type, title, message, relatedId, relatedModel }) => {
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    const notifications = admins.map((admin) => ({
      recipientId: admin._id,
      type,
      title,
      message,
      relatedId,
      relatedModel,
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    console.error('Admin notification failed:', err.message);
  }
};

module.exports = { createNotification, createAuditLog, notifyAdmins };
