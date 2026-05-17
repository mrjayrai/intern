const asyncHandler = require('../utils/asyncHandler');

exports.listCertificates = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: [], message: 'List certificates placeholder' });
});

exports.issueCertificate = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: req.body, message: 'Issue certificate placeholder' });
});
