const asyncHandler = require('../utils/asyncHandler');

exports.listNotifications = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: [], message: 'List notifications placeholder' });
});
