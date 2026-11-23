const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token
 * @param {string} id - User MongoDB ObjectId
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

/**
 * Generate a password reset token (plain random string)
 */
const generateResetToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

module.exports = { generateToken, generateResetToken };
