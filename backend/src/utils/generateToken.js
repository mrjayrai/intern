const jwt = require('jsonwebtoken');

const signAccessToken = (payload) => {
	const secret = process.env.JWT_SECRET || 'changeme_access_secret';
	const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
	return jwt.sign(payload, secret, { expiresIn });
};

const signRefreshToken = (payload) => {
	const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || 'changeme_refresh_secret';
	const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
	return jwt.sign(payload, secret, { expiresIn });
};

const verifyAccessToken = (token) => {
	const secret = process.env.JWT_SECRET || 'changeme_access_secret';
	return jwt.verify(token, secret);
};

const verifyRefreshToken = (token) => {
	const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || 'changeme_refresh_secret';
	return jwt.verify(token, secret);
};

module.exports = {
	signAccessToken,
	signRefreshToken,
	verifyAccessToken,
	verifyRefreshToken,
};

