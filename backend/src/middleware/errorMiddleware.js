const ApiError = require('../utils/apiError');

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const payload = {
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || undefined,
  };

  if (process.env.NODE_ENV !== 'production' && statusCode !== 401) {
    payload.stack = err.stack;
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate record conflict',
      errors: Object.keys(err.keyPattern || {}).map((field) => `${field} already exists`),
    });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error) => error.message);
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  if (err instanceof ApiError) {
    return res.status(statusCode).json(payload);
  }

  return res.status(statusCode).json(payload);
};
