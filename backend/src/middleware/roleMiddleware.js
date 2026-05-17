const ApiError = require('../utils/apiError');

module.exports = (allowedRoles = []) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Not authenticated'));
  }

  if (!Array.isArray(allowedRoles)) {
    allowedRoles = [allowedRoles];
  }

  if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, 'Forbidden: insufficient role'));
  }

  next();
};
