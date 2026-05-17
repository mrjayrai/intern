const ApiError = require('../utils/apiError');
const NDA = require('../models/NDA');
const Referral = require('../models/Referral');
const auditService = require('./auditService');
const workflowService = require('./workflowService');
const { WORKFLOW_STAGES } = require('../constants/workflowStages');

const uploadNdaForReferral = async (referralId, file, actor = {}) => {
  const referral = await Referral.findById(referralId);
  if (!referral) throw new ApiError(404, 'Referral not found');

  const nda = new NDA({
    referral: referral._id,
    filePath: `/uploads/ndas/${file.filename}`,
    uploadedBy: actor.name,
    uploadedById: actor.id,
  });

  await nda.save();

  await auditService.createAuditLog({
    action: 'UPLOAD_NDA',
    resourceType: 'NDA',
    resourceId: nda._id,
    performedBy: actor.name,
    performedById: actor.id,
    details: { file: nda.filePath, referral: referral._id },
  });

  return nda;
};

const signNdaForReferral = async (referralId, signerInfo = {}, actor = {}) => {
  const referral = await Referral.findById(referralId);
  if (!referral) throw new ApiError(404, 'Referral not found');

  const nda = await NDA.findOne({ referral: referral._id, archived: { $ne: true } }).sort({ createdAt: -1 });
  if (!nda) throw new ApiError(404, 'NDA document not found for this referral');
  if (nda.signed) throw new ApiError(400, 'NDA already signed');

  nda.signed = true;
  nda.signedBy = signerInfo.signedBy || actor.name;
  nda.signedById = signerInfo.signedById || actor.id;
  nda.signedAt = new Date();
  await nda.save();

  await auditService.createAuditLog({
    action: 'SIGN_NDA',
    resourceType: 'NDA',
    resourceId: nda._id,
    performedBy: nda.signedBy,
    performedById: nda.signedById,
    details: { referral: referral._id },
  });

  // After signing, try to progress referral workflow if currently waiting on NDA
  try {
    const current = referral.workflowStage;
    if (current === WORKFLOW_STAGES.NDA_PENDING) {
      const next = WORKFLOW_STAGES.NON_WORKER_ID_PENDING;
      await workflowService.transitionReferralStage(referral, next, { name: nda.signedBy, id: nda.signedById }, 'NDA signed');
    }
  } catch (err) {
    // don't block signing on workflow failures; just log an audit entry
    await auditService.createAuditLog({
      action: 'SIGN_NDA_WORKFLOW_ERROR',
      resourceType: 'NDA',
      resourceId: nda._id,
      performedBy: actor.name,
      performedById: actor.id,
      details: { error: err.message },
    });
  }

  return nda;
};

const archiveNda = async (referralId, reason = '', actor = {}) => {
  const nda = await NDA.findOne({ referral: referralId }).sort({ createdAt: -1 });
  if (!nda) throw new ApiError(404, 'NDA document not found');
  nda.archived = true;
  nda.archiveReason = reason;
  await nda.save();

  await auditService.createAuditLog({
    action: 'ARCHIVE_NDA',
    resourceType: 'NDA',
    resourceId: nda._id,
    performedBy: actor.name,
    performedById: actor.id,
    details: { reason },
  });

  return nda;
};

const getNdaByReferral = async (referralId) => {
  return NDA.findOne({ referral: referralId, archived: { $ne: true } }).sort({ createdAt: -1 });
};

module.exports = {
  uploadNdaForReferral,
  signNdaForReferral,
  archiveNda,
  getNdaByReferral,
};
