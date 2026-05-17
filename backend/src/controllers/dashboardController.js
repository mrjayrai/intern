const asyncHandler = require('../utils/asyncHandler');

exports.getDashboard = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { stats: {}, timeline: [] }, message: 'Dashboard placeholder' });
});
