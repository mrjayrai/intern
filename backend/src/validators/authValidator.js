const validateEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

const validateRegister = (req) => {
  const errors = [];
  const { name, email, password } = req.body || {};

  if (!name) errors.push('Name is required');
  if (!email) errors.push('Email is required');
  if (email && !validateEmail(email)) errors.push('Email must be valid');
  if (!password) errors.push('Password is required');
  if (password && password.length < 8) errors.push('Password must be at least 8 characters long');

  return errors;
};

const validateLogin = (req) => {
  const errors = [];
  const { email, password } = req.body || {};

  if (!email) errors.push('Email is required');
  if (email && !validateEmail(email)) errors.push('Email must be valid');
  if (!password) errors.push('Password is required');

  return errors;
};

const validateRefreshToken = (req) => {
  const errors = [];
  const token = req.cookies && req.cookies.refreshToken ? req.cookies.refreshToken : req.body.refreshToken;

  if (!token) {
    errors.push('Refresh token is required');
  }

  return errors;
};

module.exports = {
  validateRegister,
  validateLogin,
  validateRefreshToken,
};
