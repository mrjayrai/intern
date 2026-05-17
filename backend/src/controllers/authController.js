const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/generateToken');
const logger = require('../utils/logger');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ success: false, message: 'Email already in use' });

  const user = new User({ name, email, password, role });
  await user.save();

  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id, role: user.role });

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  res.status(201).json({
    success: true,
    data: {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });

  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  if (!user.isActive) return res.status(403).json({ success: false, message: 'User is deactivated' });

  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id, role: user.role });

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  res.status(200).json({ success: true, data: { accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } } });
});

exports.logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies && req.cookies.refreshToken ? req.cookies.refreshToken : req.body.refreshToken;

  if (!refreshToken) {
    res.clearCookie('refreshToken');
    return res.status(200).json({ success: true, message: 'Logged out' });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.id).select('+refreshToken');
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }
  } catch (err) {
    logger.warn('Invalid refresh token during logout');
  }

  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, message: 'Logged out' });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies && req.cookies.refreshToken ? req.cookies.refreshToken : req.body.refreshToken;

  if (!token) return res.status(401).json({ success: false, message: 'Refresh token required' });

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }

  const user = await User.findById(payload.id).select('+refreshToken');
  if (!user || !user.refreshToken) return res.status(401).json({ success: false, message: 'Invalid session' });
  if (user.refreshToken !== token) return res.status(401).json({ success: false, message: 'Refresh token mismatch' });

  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id, role: user.role });

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  res.status(200).json({ success: true, data: { accessToken } });
});
