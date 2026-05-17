const User = require('../models/User');
const { verifyAccessToken } = require('../utils/generateToken');

module.exports = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization || '';
		const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

		if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

		const payload = verifyAccessToken(token);
		const user = await User.findById(payload.id).select('-password -refreshToken');
		if (!user) return res.status(401).json({ success: false, message: 'User not found' });

		req.user = { id: user._id, role: user.role, email: user.email, name: user.name };
		next();
	} catch (err) {
		return res.status(401).json({ success: false, message: 'Invalid or expired token' });
	}
};
