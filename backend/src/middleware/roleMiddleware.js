module.exports = (allowedRoles = []) => (req, res, next) => {
	if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });

	if (!Array.isArray(allowedRoles)) allowedRoles = [allowedRoles];

	if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
		return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
	}

	next();
};
