const ApiError = require('../utils/apiError');
const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/generateToken');
const { ROLES } = require('../constants/roles');

const buildUserPayload = ({ name, email, password, role }) => ({
  name,
  email,
  password,
  role: Object.values(ROLES).includes(role) ? role : ROLES.CANDIDATE,
});

const buildAuthTokens = (user) => ({
  accessToken: signAccessToken({ id: user._id, role: user.role }),
  refreshToken: signRefreshToken({ id: user._id, role: user.role }),
});

const registerUser = async (payload) => {
  const data = buildUserPayload(payload);
  const user = new User(data);

  try {
    await user.save();
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, 'Email already in use');
    }
    throw error;
  }

  const tokens = buildAuthTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user: user.toJSON(),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid credentials');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'User account is deactivated');
  }

  const tokens = buildAuthTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user: user.toJSON(),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

const logoutUser = async (token) => {
  if (!token) return;

  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.id).select('+refreshToken');
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }
  } catch (err) {
    // ignore invalid refresh token during logout
  }
};

const refreshAuthTokens = async (token) => {
  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.id).select('+refreshToken');
    if (!user || !user.refreshToken || user.refreshToken !== token) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const tokens = buildAuthTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Invalid refresh token');
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAuthTokens,
};
