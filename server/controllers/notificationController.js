const Notification = require('../models/Notification');
const { success, error } = require('../utils/apiResponse');

// @desc    Get notifications for logged-in user
// @route   GET /api/notifications
// @access  Auth
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = { recipientId: req.user._id };
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    success(res, { notifications, unreadCount, total });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Auth
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return error(res, 'Notification not found', 404);
    success(res, { notification }, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Auth
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { isRead: true }
    );
    success(res, {}, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Auth
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ recipientId: req.user._id, isRead: false });
    success(res, { count });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, getUnreadCount };
