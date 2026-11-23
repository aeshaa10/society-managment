const SocietySettings = require('../models/SocietySettings');
const { success, error } = require('../utils/apiResponse');
const { createAuditLog } = require('../services/notificationService');

// @desc    Get society settings
// @route   GET /api/settings
// @access  Auth
const getSettings = async (req, res, next) => {
  try {
    let settings = await SocietySettings.findOne();
    if (!settings) {
      settings = await SocietySettings.create({});
    }
    success(res, { settings });
  } catch (err) {
    next(err);
  }
};

// @desc    Update society settings
// @route   PUT /api/settings
// @access  Admin
const updateSettings = async (req, res, next) => {
  try {
    let settings = await SocietySettings.findOne();
    if (!settings) {
      settings = await SocietySettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }

    await createAuditLog({
      performedBy: req.user._id,
      userRole: req.user.role,
      action: 'SETTINGS_UPDATED',
      targetModel: 'SocietySettings',
      targetId: settings._id,
      description: 'Society settings updated',
      metadata: req.body,
      ipAddress: req.ip,
    });

    success(res, { settings }, 'Settings updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSettings };
