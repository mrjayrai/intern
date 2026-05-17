const ApiError = require('../utils/apiError');

const validateRequest = (validator) => (req, res, next) => {
  const errors = validator(req);
  if (!errors || !errors.length) return next();

  return next(new ApiError(400, 'Validation failed', errors));
};

module.exports = {
  validateRequest,
};
