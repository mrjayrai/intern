const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const ApiError = require('../utils/apiError');

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
};

exports.register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(req.body);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ success: true, data: { user, accessToken } });
});

exports.login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body);
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ success: true, data: { user, accessToken } });
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies && req.cookies.refreshToken ? req.cookies.refreshToken : req.body.refreshToken;
  await authService.logoutUser(token);
  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies && req.cookies.refreshToken ? req.cookies.refreshToken : req.body.refreshToken;
  if (!token) {
    throw new ApiError(401, 'Refresh token required');
  }

  const { accessToken, refreshToken } = await authService.refreshAuthTokens(token);
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ success: true, data: { accessToken } });
});
