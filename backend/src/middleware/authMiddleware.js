const ApiError = require('../utils/apiError');
const User = require('../models/User');
const { verifyAccessToken } = require('../utils/generateToken');

const createUnauthorizedError = () => new ApiError(401, 'Unauthorized');

const parseBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) {
    return { token: null, reason: 'missing_token' };
  }

  const parts = authorizationHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return { token: null, reason: 'malformed_token' };
  }

  return { token: parts[1], reason: null };
};

module.exports = async (req, res, next) => {
  const parsed = parseBearerToken(req.headers.authorization || '');
  const token = parsed.token || req.query.token;
  const reason = parsed.reason;

  if (!token) {
    req.authErrorReason = reason;
    return next(createUnauthorizedError());
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.id).select('-password -refreshToken');

    if (!user) {
      return next(createUnauthorizedError());
    }

    req.user = { id: user._id, role: user.role, email: user.email, name: user.name };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return next(createUnauthorizedError());
    }

    next(createUnauthorizedError());
  }
};
