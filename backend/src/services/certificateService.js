const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Certificate = require('../models/Certificate');
const Referral = require('../models/Referral');
const auditService = require('./auditService');
const workflowService = require('./workflowService');
const { createCertificatePdf } = require('../utils/pdfGenerator');
const { validateCertificatePayload } = require('../validators/certificateValidator');
const ApiError = require('../utils/apiError');
const { WORKFLOW_STAGES } = require('../constants/workflowStages');

const buildCertificateData = (payload, user) => ({
  candidate: payload.candidate.trim(),
  mentor: payload.mentor.trim(),
  internshipDuration: payload.internshipDuration.trim(),
  completionDate: new Date(payload.completionDate),
  issuedBy: user._id,
  verificationId: payload.verificationId && typeof payload.verificationId === 'string'
    ? payload.verificationId.trim()
    : uuidv4(),
  referralId: payload.referralId ? payload.referralId : undefined,
});

const getAllCertificates = async (filters = {}) => {
  return Certificate.find(filters)
    .populate('issuedBy', 'name email')
    .sort({ createdAt: -1 });
};

const getCertificateById = async (id) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid certificate id');
  }

  return Certificate.findById(id).populate('issuedBy', 'name email');
};

const issueCertificate = async (payload, user) => {
  const errors = validateCertificatePayload(payload);
  if (errors.length) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  const certificateData = buildCertificateData(payload, user);
  const issuedByName = user.name || user.email || 'Intern Flow Team';

  certificateData.pdfPath = await createCertificatePdf({
    candidate: certificateData.candidate,
    mentor: certificateData.mentor,
    internshipDuration: certificateData.internshipDuration,
    completionDate: certificateData.completionDate,
    issuedByName,
    verificationId: certificateData.verificationId,
  });

  const certificate = await Certificate.create(certificateData);

  if (payload.referralId) {
    const referral = await Referral.findById(payload.referralId);
    if (!referral) {
      throw new ApiError(404, 'Referral not found');
    }

    await workflowService.transitionReferralStage(
      referral,
      WORKFLOW_STAGES.CERTIFICATE_ISSUED,
      { name: issuedByName, id: user._id },
      'Certificate issued'
    );
  }

  await auditService.createAuditLog({
    action: 'CERTIFICATE_ISSUED',
    resourceType: 'Certificate',
    resourceId: certificate._id,
    performedBy: issuedByName,
    performedById: user._id,
    details: {
      candidate: certificate.candidate,
      mentor: certificate.mentor,
      verificationId: certificate.verificationId,
      referralId: certificate.referralId,
    },
  });

  return certificate;
};

const getCertificatePdfPathById = async (id) => {
  const certificate = await Certificate.findById(id);
  if (!certificate) {
    throw new ApiError(404, 'Certificate not found');
  }

  if (!certificate.pdfPath) {
    throw new ApiError(404, 'Certificate PDF path not found');
  }

  const resolvedPath = path.resolve(path.join(__dirname, '..', certificate.pdfPath));
  if (!fs.existsSync(resolvedPath)) {
    throw new ApiError(404, 'Certificate PDF not found');
  }

  return resolvedPath;
};

module.exports = {
  getAllCertificates,
  getCertificateById,
  issueCertificate,
  getCertificatePdfPathById,
};
