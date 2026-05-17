const ApiError = require('../utils/apiError');
const User = require('../models/User');
const { verifyAccessToken } = require('../utils/generateToken');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next(new ApiError(401, 'Authentication token missing'));
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.id).select('-password -refreshToken');
    if (!user) {
      return next(new ApiError(401, 'User not found'));
    }

    req.user = { id: user._id, role: user.role, email: user.email, name: user.name };
    next();
  } catch (error) {
    next(new ApiError(401, 'Invalid or expired access token'));
  }
};
