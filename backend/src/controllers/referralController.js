const asyncHandler = require('../utils/asyncHandler');

exports.listReferrals = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: [], message: 'List referrals placeholder' });
});

exports.createReferral = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: req.body, message: 'Create referral placeholder' });
});
