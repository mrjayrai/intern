const asyncHandler = require('../utils/asyncHandler');

exports.listNDAs = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: [], message: 'List NDAs placeholder' });
});

exports.submitNDA = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: req.body, message: 'Submit NDA placeholder' });
});
