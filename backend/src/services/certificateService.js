const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Certificate = require('../models/Certificate');
const Referral = require('../models/Referral');
const auditService = require('./auditService');
const workflowService = require('./workflowService');
const emailService = require('./emailService');
const { createCertificatePdf } = require('../utils/pdfGenerator');
const { validateCertificatePayload } = require('../validators/certificateValidator');
const ApiError = require('../utils/apiError');
const { WORKFLOW_STAGES } = require('../constants/workflowStages');

const buildCertificateData = (payload, user) => ({
  candidate: (payload.candidate || payload.candidateName).trim(),
  candidateEmail: payload.candidateEmail ? payload.candidateEmail.trim().toLowerCase() : undefined,
  department: payload.department ? payload.department.trim() : undefined,
  mentor: (payload.mentor || payload.mentorName).trim(),
  mentorEmail: payload.mentorEmail ? payload.mentorEmail.trim().toLowerCase() : undefined,
  internshipDuration: (payload.internshipDuration || payload.internshipPeriod).trim(),
  completionDate: new Date(payload.completionDate),
  issuedBy: user._id || user.id,
  verificationId: payload.verificationId && typeof payload.verificationId === 'string'
    ? payload.verificationId.trim()
    : uuidv4(),
  referralId: payload.referralId ? payload.referralId : undefined,
});

const buildCertificateLink = (certificateId) => {
  const publicBaseUrl = (process.env.PUBLIC_API_URL || process.env.APP_URL || '').replace(/\/$/, '');
  return `${publicBaseUrl}/api/certificates/download/${certificateId}`;
};

const resolveGeneratedPdfPath = (relativePath) => path.resolve(path.join(__dirname, '..', relativePath));

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

  // Validate completion date is not in the future
  const completionDate = new Date(payload.completionDate);
  if (completionDate > new Date()) {
    throw new ApiError(400, 'Certificate cannot be issued for a future completion date');
  }

  // Idempotency guard: Check if certificate already exists for this referral
  if (payload.referralId) {
    const existingCertificate = await Certificate.findOne({
      referralId: payload.referralId,
      candidateEmail: payload.candidateEmail
    });
    if (existingCertificate) {
      console.log('[Certificate] Certificate already exists for referral:', payload.referralId);
      throw new ApiError(400, 'Certificate already issued for this referral');
    }

    // Workflow eligibility validation
    const referral = await Referral.findById(payload.referralId);
    if (!referral) {
      throw new ApiError(404, 'Referral not found');
    }

    // Certificate can only be issued if internship is completed
    const eligibleStages = [WORKFLOW_STAGES.COMPLETED, WORKFLOW_STAGES.CERTIFICATE_PENDING];
    if (!eligibleStages.includes(referral.workflowStage)) {
      console.warn(`[Security] Certificate issuance attempt for ineligible workflow stage: ${referral.workflowStage} (referral: ${payload.referralId})`);
      throw new ApiError(400, `Certificate cannot be issued before internship completion. Current stage: ${referral.workflowStage}. Required stages: COMPLETED or CERTIFICATE_PENDING.`);
    }

    console.log(`[Certificate] Workflow eligibility validated for referral ${payload.referralId}: stage ${referral.workflowStage}`);
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
    department: certificateData.department || 'General',
    role: 'Intern',
  });

  const certificate = await Certificate.create(certificateData);

  // Send certificate email (queued for reliable delivery)
  if (certificate.candidateEmail) {
    console.log(`[Certificate] Queueing certificate email for ${certificate.candidateEmail}`);
    await emailService.enqueueEmail(
      certificate.candidateEmail,
      'certificate',
      {
        name: certificate.candidate,
        certificateLink: buildCertificateLink(certificate._id),
        verificationId: certificate.verificationId,
      },
      {
        attachments: [
          {
            filename: `InternFlow-Certificate-${certificate.verificationId}.pdf`,
            path: resolveGeneratedPdfPath(certificate.pdfPath),
            contentType: 'application/pdf',
          },
        ],
      }
    );
    // Trigger queue processing asynchronously (non-blocking)
    emailService.processQueue(10).catch((err) => {
      console.error('[Certificate] Queue processing error:', err?.message || err);
    });
    console.log(`[Certificate] Certificate email queued successfully`);
  }

  if (payload.referralId) {
    // Referral already fetched and validated in eligibility check above
    const referral = await Referral.findById(payload.referralId);

    await workflowService.transitionReferralStage(
      referral,
      WORKFLOW_STAGES.CERTIFICATE_ISSUED,
      { name: issuedByName, id: user._id || user.id },
      'Certificate issued'
    );

    // RULE 6: Auto-transition to COMPLETED after certificate issuance
    console.log(`[CERTIFICATE_COMPLETION_TRIGGER] Certificate issued for ${certificate.candidate}, transitioning to COMPLETED`);

    // Reload referral to get updated stage
    await referral.reload();

    if (workflowService.validateTransition(referral.workflowStage, WORKFLOW_STAGES.COMPLETED)) {
      await workflowService.transitionReferralStage(
        referral,
        WORKFLOW_STAGES.COMPLETED,
        { name: 'System', id: user._id || user.id },
        'Internship completed - certificate issued'
      );
      console.log(`[CERTIFICATE_COMPLETION_TRIGGER] ✅ Internship marked as COMPLETED`);
    }
  }

  await auditService.createAuditLog({
    action: 'CERTIFICATE_ISSUED',
    resourceType: 'Certificate',
    resourceId: certificate._id,
    performedBy: issuedByName,
    performedById: user._id || user.id,
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
