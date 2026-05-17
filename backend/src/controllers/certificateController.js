const asyncHandler = require('../utils/asyncHandler');
const certificateService = require('../services/certificateService');
const ApiError = require('../utils/apiError');

exports.listCertificates = asyncHandler(async (req, res) => {
  const certificates = await certificateService.getAllCertificates();
  res.status(200).json({ success: true, data: certificates });
});

exports.getCertificateById = asyncHandler(async (req, res) => {
  const certificate = await certificateService.getCertificateById(req.params.id);
  if (!certificate) {
    throw new ApiError(404, 'Certificate not found');
  }
  res.status(200).json({ success: true, data: certificate });
});

exports.issueCertificate = asyncHandler(async (req, res) => {
  const certificate = await certificateService.issueCertificate(req.body, req.user);
  res.status(201).json({ success: true, data: certificate });
});

exports.downloadCertificate = asyncHandler(async (req, res, next) => {
  const filePath = await certificateService.getCertificatePdfPathById(req.params.id);
  const fileName = `${req.params.id}.pdf`;
  res.download(filePath, fileName, (err) => {
    if (err) {
      return next(err);
    }
  });
});
