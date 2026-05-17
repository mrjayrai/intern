const asyncHandler = require('../utils/asyncHandler');

exports.login = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Login endpoint placeholder' });
});

exports.register = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, message: 'Register endpoint placeholder' });
});

exports.logout = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Logout endpoint placeholder' });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Refresh token endpoint placeholder' });
});
