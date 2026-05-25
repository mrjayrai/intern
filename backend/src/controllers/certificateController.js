const asyncHandler = require('../utils/asyncHandler');
const certificateService = require('../services/certificateService');
const ApiError = require('../utils/apiError');
const { ROLES, ADMIN_ROLES } = require('../constants/roles');

exports.listCertificates = asyncHandler(async (req, res) => {
  const user = req.user;
  let filters = {};

  // Ownership validation: candidates only see their own certificates
  if (user.role === ROLES.CANDIDATE) {
    filters = { candidateEmail: user.email };
    console.log(`[Security] Candidate ${user.email} listing their own certificates`);
  }

  const certificates = await certificateService.getAllCertificates(filters);
  res.status(200).json({ success: true, data: certificates });
});

exports.getCertificateById = asyncHandler(async (req, res) => {
  const certificate = await certificateService.getCertificateById(req.params.id);
  if (!certificate) {
    throw new ApiError(404, 'Certificate not found');
  }

  const user = req.user;
  // Ownership validation: candidates can only view their own certificates
  if (user.role === ROLES.CANDIDATE && certificate.candidateEmail !== user.email) {
    console.warn(`[Security] Unauthorized certificate access attempt by ${user.email} for certificate ${req.params.id}`);
    throw new ApiError(403, 'Forbidden: Cannot access certificates for other candidates');
  }

  res.status(200).json({ success: true, data: certificate });
});

exports.issueCertificate = asyncHandler(async (req, res) => {
  const certificate = await certificateService.issueCertificate(req.body, req.user);
  res.status(201).json({ success: true, data: certificate });
});

exports.downloadCertificate = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const certificate = await certificateService.getCertificateById(req.params.id);
  if (!certificate) {
    throw new ApiError(404, 'Certificate not found');
  }

  // Ownership validation: candidates can only download their own certificates
  if (user && user.role === ROLES.CANDIDATE && certificate.candidateEmail !== user.email) {
    console.warn(`[Security] Unauthorized certificate download attempt by ${user.email} for certificate ${req.params.id}`);
    throw new ApiError(403, 'Forbidden: Cannot download certificates for other candidates');
  }

  const filePath = await certificateService.getCertificatePdfPathById(req.params.id);
  const fileName = `InternFlow-Certificate-${certificate.verificationId}.pdf`;
  res.download(filePath, fileName, (err) => {
    if (err) {
      return next(err);
    }
  });
});
