const path = require('path');
const ApiError = require('../utils/apiError');
const NDA = require('../models/NDA');
const Referral = require('../models/Referral');
const auditService = require('./auditService');
const notificationService = require('./notificationService');
const emailService = require('./emailService');
const workflowService = require('./workflowService');
const { WORKFLOW_STAGES } = require('../constants/workflowStages');
const { ROLES } = require('../constants/roles');
const config = require('../config/environment');

const documentTypeForFilename = (filename) => {
  const ext = path.extname(filename || '').toLowerCase();
  if (ext === '.pdf') return 'PDF';
  if (ext === '.doc') return 'DOC';
  if (ext === '.docx') return 'DOCX';
  return undefined;
};

const buildDocumentUrl = (filename) => (filename ? `/uploads/nda/${filename}` : undefined);

const buildCandidateNotification = async (nda, title, message, metadata = {}) => {
  if (nda.candidateId) {
    await notificationService.createNotification({
      user: nda.candidateId,
      title,
      message,
      type: 'NDA',
      workflowStage: nda.workflowStage,
      metadata,
      performedByName: 'System',
      performedById: nda.candidateId,
    });
  }
};

const sendNdaEmail = async (to, templateVars) => {
  if (!to) return;
  await emailService.enqueueEmail(to, 'ndaStatusUpdate', templateVars).catch((err) => {
    console.error('Failed to enqueue NDA email:', err?.message || err);
  });
};

const getAllNdas = async (filters = {}, query = {}) => {
  const dbQuery = {};
  if (filters.status) dbQuery.status = filters.status;
  if (filters.workflowStage) dbQuery.workflowStage = filters.workflowStage;
  if (filters.referralId) dbQuery.referral = filters.referralId;
  if (filters.title) dbQuery.title = new RegExp(filters.title, 'i');

  // Candidate ownership filter: use OR logic (match EITHER candidateId OR candidateEmail)
  if (filters.candidateId || filters.candidateEmail) {
    const candidateOrConditions = [];
    if (filters.candidateId) {
      candidateOrConditions.push({ candidateId: filters.candidateId });
    }
    if (filters.candidateEmail) {
      candidateOrConditions.push({ candidateEmail: filters.candidateEmail });
    }
    if (candidateOrConditions.length > 0) {
      dbQuery.$or = candidateOrConditions;
    }
  }

  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  const [data, total] = await Promise.all([
    NDA.find(dbQuery).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit).lean(),
    NDA.countDocuments(dbQuery),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const getNdaById = async (id) => NDA.findById(id);

const createNda = async (data = {}, file, actor = {}) => {
  const referral = data.referralId ? await Referral.findById(data.referralId) : null;
  if (data.referralId && !referral) throw new ApiError(404, 'Referral not found');

  const status = file ? 'PENDING_SIGNATURE' : 'DRAFT';
  const documentUrl = file ? buildDocumentUrl(file.filename) : undefined;
  const documentType = file ? documentTypeForFilename(file.originalname) : undefined;
  const workflowStage = referral
    ? workflowService.validateTransition(referral.workflowStage, WORKFLOW_STAGES.NDA_PENDING)
      ? WORKFLOW_STAGES.NDA_PENDING
      : referral.workflowStage
    : WORKFLOW_STAGES.NDA_PENDING;

  const nda = new NDA({
    referral: referral?._id,
    title: data.title,
    description: data.description,
    candidateId: data.candidateId,
    candidateName: data.candidateName || referral?.candidateName,
    candidateEmail: data.candidateEmail || referral?.candidateEmail,
    documentUrl,
    originalFilename: file ? file.originalname : undefined,
    documentType,
    version: file ? 1 : 1,
    status,
    uploadedBy: file ? actor.name : undefined,
    uploadedById: file ? actor.id : undefined,
    signedAt: undefined,
    approvedAt: undefined,
    rejectedAt: undefined,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    signatureName: undefined,
    signatureAccepted: false,
    ipAddress: undefined,
    userAgent: undefined,
    notes: data.notes,
    workflowStage,
  });

  const saved = await nda.save();

  await auditService.createAuditLog({
    action: 'CREATE_NDA',
    resourceType: 'NDA',
    resourceId: saved._id,
    performedBy: actor.name,
    performedById: actor.id,
    details: { data: { title: data.title, status, referral: data.referralId } },
  });

  if (referral && workflowService.validateTransition(referral.workflowStage, WORKFLOW_STAGES.NDA_PENDING)) {
    await workflowService.transitionReferralStage(referral, WORKFLOW_STAGES.NDA_PENDING, actor, 'NDA record created');
  }

  if (saved.status === 'PENDING_SIGNATURE' && saved.candidateEmail) {
    await buildCandidateNotification(saved, 'NDA pending signature', `Your NDA "${saved.title}" is ready for sign-off.`, { ndaId: saved._id });
    await sendNdaEmail(saved.candidateEmail, {
      name: saved.candidateName || 'Candidate',
      ndaTitle: saved.title,
      status: saved.status,
      note: 'Please sign the NDA to continue onboarding.',
      actionUrl: config.getNdaUrl(saved._id),
    });
  }

  return saved;
};

const updateNda = async (ndaId, data = {}, file, actor = {}) => {
  const nda = await NDA.findById(ndaId);
  if (!nda) throw new ApiError(404, 'NDA not found');
  if (nda.status === 'ARCHIVED') throw new ApiError(400, 'Cannot update archived NDA');

  if (data.title) nda.title = data.title;
  if (data.description) nda.description = data.description;
  if (data.candidateId) nda.candidateId = data.candidateId;
  if (data.candidateName) nda.candidateName = data.candidateName;
  if (data.candidateEmail) nda.candidateEmail = data.candidateEmail;
  if (data.expiresAt) nda.expiresAt = new Date(data.expiresAt);
  if (typeof data.notes === 'string') nda.notes = data.notes;

  if (file) {
    nda.documentUrl = buildDocumentUrl(file.filename);
    nda.originalFilename = file.originalname;
    nda.documentType = documentTypeForFilename(file.originalname);
    nda.uploadedBy = actor.name;
    nda.uploadedById = actor.id;
    nda.version = (nda.version || 1) + 1;
    nda.status = 'PENDING_SIGNATURE';
    nda.signatureName = undefined;
    nda.signatureAccepted = false;
    nda.signedAt = undefined;
    nda.approvedAt = undefined;
    nda.rejectedAt = undefined;
  }

  const updated = await nda.save();

  await auditService.createAuditLog({
    action: 'UPDATE_NDA',
    resourceType: 'NDA',
    resourceId: updated._id,
    performedBy: actor.name,
    performedById: actor.id,
    details: { changes: data, file: file ? updated.documentUrl : undefined },
  });

  if (file && updated.candidateEmail) {
    await buildCandidateNotification(updated, 'NDA updated', `The NDA "${updated.title}" has been updated and requires your signature.`, { ndaId: updated._id });
    await sendNdaEmail(updated.candidateEmail, {
      name: updated.candidateName || 'Candidate',
      ndaTitle: updated.title,
      status: updated.status,
      note: 'A new NDA document has been uploaded and is ready for your review.',
      actionUrl: config.getNdaUrl(updated._id),
    });
  }

  return updated;
};

const deleteNda = async (ndaId, actor = {}) => {
  const nda = await NDA.findByIdAndDelete(ndaId);
  if (!nda) return null;
  await auditService.createAuditLog({
    action: 'DELETE_NDA',
    resourceType: 'NDA',
    resourceId: nda._id,
    performedBy: actor.name,
    performedById: actor.id,
    details: { title: nda.title },
  });
  return nda;
};

const signNda = async (ndaId, signerInfo = {}, actor = {}) => {
  const nda = await NDA.findById(ndaId);
  if (!nda) throw new ApiError(404, 'NDA not found');
  if (nda.status !== 'PENDING_SIGNATURE') throw new ApiError(400, 'NDA cannot be signed in its current status');

  if (actor.role === ROLES.CANDIDATE) {
    const ownsNda = nda.candidateId?.toString() === actor.id?.toString() || nda.candidateEmail === actor.email;
    if (!ownsNda) {
      console.warn(`[Security] Unauthorized NDA signing attempt by candidate ${actor.email} (ID: ${actor.id}) for NDA ${ndaId}`);
      await auditService.createAuditLog({
        action: 'UNAUTHORIZED_NDA_SIGN_ATTEMPT',
        resourceType: 'NDA',
        resourceId: ndaId,
        performedBy: actor.name,
        performedById: actor.id,
        details: {
          reason: 'Candidate attempted to sign NDA not assigned to them',
          candidateEmail: actor.email,
          ndaCandidateEmail: nda.candidateEmail,
        },
      });
      throw new ApiError(403, 'Forbidden: cannot sign this NDA');
    }
  }

  nda.signatureName = signerInfo.signatureName;
  nda.signatureAccepted = signerInfo.signatureAccepted === true;
  nda.ipAddress = signerInfo.ipAddress;
  nda.userAgent = signerInfo.userAgent;
  nda.signedAt = new Date();
  nda.status = 'SIGNED';
  if (typeof signerInfo.notes === 'string') nda.notes = signerInfo.notes;

  const updated = await nda.save();

  await auditService.createAuditLog({
    action: 'SIGN_NDA',
    resourceType: 'NDA',
    resourceId: updated._id,
    performedBy: actor.name,
    performedById: actor.id,
    details: { signatureName: updated.signatureName, candidateEmail: updated.candidateEmail },
  });

  if (updated.candidateEmail) {
    await sendNdaEmail(updated.candidateEmail, {
      name: updated.candidateName || 'Candidate',
      ndaTitle: updated.title,
      status: updated.status,
      note: 'Your NDA has been signed successfully.',
      actionUrl: config.getDocumentsUrl(),
    });
  }

  if (updated.candidateId) {
    await buildCandidateNotification(updated, 'NDA signed', `The NDA "${updated.title}" has been signed.`, { ndaId: updated._id });
  }

  // Workflow progression: Notify HR/Compliance after NDA signing
  if (updated.referral) {
    const referral = await Referral.findById(updated.referral);
    if (referral) {
      console.log(`[Workflow] NDA signed for referral ${referral._id}, notifying HR for approval`);

      // Notify HR/Compliance that NDA needs approval
      await notificationService.createNotification({
        user: referral.recruiterId || referral.hrContactId,
        title: 'NDA Signed - Approval Required',
        message: `${updated.candidateName || 'Candidate'} has signed their NDA "${updated.title}". Please review and approve.`,
        type: 'NDA_APPROVAL_REQUIRED',
        workflowStage: referral.workflowStage,
        metadata: { ndaId: updated._id, referralId: referral._id },
        performedByName: actor.name,
        performedById: actor.id,
      });

      console.log(`[Workflow] NDA signing notification sent for referral ${referral._id}`);
    }
  }

  return updated;
};

const approveNda = async (ndaId, approveInfo = {}, actor = {}) => {
  const nda = await NDA.findById(ndaId);
  if (!nda) throw new ApiError(404, 'NDA not found');
  if (nda.status !== 'SIGNED') throw new ApiError(400, 'Only signed NDAs can be approved');

  nda.status = 'APPROVED';
  nda.approvedAt = new Date();
  if (typeof approveInfo.notes === 'string') nda.notes = approveInfo.notes;

  const updated = await nda.save();

  await auditService.createAuditLog({
    action: 'APPROVE_NDA',
    resourceType: 'NDA',
    resourceId: updated._id,
    performedBy: actor.name,
    performedById: actor.id,
    details: { notes: approveInfo.notes },
  });

  if (updated.candidateEmail) {
    await sendNdaEmail(updated.candidateEmail, {
      name: updated.candidateName || 'Candidate',
      ndaTitle: updated.title,
      status: updated.status,
      note: 'Your NDA has been approved.',
      actionUrl: config.getDocumentsUrl(),
    });
  }

  // Workflow transition and downstream triggers after NDA approval
  if (updated.referral) {
    const referral = await Referral.findById(updated.referral);
    if (referral && workflowService.validateTransition(referral.workflowStage, WORKFLOW_STAGES.NON_WORKER_ID_PENDING)) {
      await workflowService.transitionReferralStage(referral, WORKFLOW_STAGES.NON_WORKER_ID_PENDING, actor, 'NDA approved');

      console.log(`[NDA] NDA approved for referral ${referral._id}, triggering downstream processes`);

      // Automatically create Non-Worker ID request after NDA approval
      try {
        const nonWorkerIdService = require('./nonWorkerIdService');
        await nonWorkerIdService.createRequest(
          {
            referralId: referral._id,
            candidateId: updated.candidateId,
            candidateName: updated.candidateName,
            candidateEmail: updated.candidateEmail,
            notes: 'Automatically created after NDA approval',
          },
          actor
        );
        console.log(`[NDA] Non-Worker ID request created for ${updated.candidateName}`);
      } catch (err) {
        console.error('[NDA] Failed to create Non-Worker ID request after NDA approval:', err?.message || err);
      }
    }
  }

  return updated;
};

const rejectNda = async (ndaId, rejectInfo = {}, actor = {}) => {
  const nda = await NDA.findById(ndaId);
  if (!nda) throw new ApiError(404, 'NDA not found');
  if (!['PENDING_SIGNATURE', 'SIGNED'].includes(nda.status)) {
    throw new ApiError(400, 'Only pending or signed NDAs can be rejected');
  }

  nda.status = 'REJECTED';
  nda.rejectedAt = new Date();
  if (typeof rejectInfo.notes === 'string') nda.notes = rejectInfo.notes;

  const updated = await nda.save();

  await auditService.createAuditLog({
    action: 'REJECT_NDA',
    resourceType: 'NDA',
    resourceId: updated._id,
    performedBy: actor.name,
    performedById: actor.id,
    details: { notes: rejectInfo.notes },
  });

  if (updated.candidateEmail) {
    await sendNdaEmail(updated.candidateEmail, {
      name: updated.candidateName || 'Candidate',
      ndaTitle: updated.title,
      status: updated.status,
      note: 'Your NDA has been rejected. Please contact the recruiter for next steps.',
      actionUrl: config.getDocumentsUrl(),
    });
  }

  return updated;
};

const expireNda = async (ndaId, actor = {}) => {
  const nda = await NDA.findById(ndaId);
  if (!nda) throw new ApiError(404, 'NDA not found');

  if (nda.status === 'EXPIRED' || nda.status === 'ARCHIVED') {
    return nda;
  }

  nda.status = 'EXPIRED';
  const updated = await nda.save();

  await auditService.createAuditLog({
    action: 'EXPIRE_NDA',
    resourceType: 'NDA',
    resourceId: updated._id,
    performedBy: actor.name,
    performedById: actor.id,
    details: {},
  });

  if (updated.candidateEmail) {
    await sendNdaEmail(updated.candidateEmail, {
      name: updated.candidateName || 'Candidate',
      ndaTitle: updated.title,
      status: updated.status,
      note: 'Your NDA has expired.',
      actionUrl: config.getDocumentsUrl(),
    });
  }

  return updated;
};

const archiveNda = async (ndaId, reason = '', actor = {}) => {
  const nda = await NDA.findById(ndaId);
  if (!nda) throw new ApiError(404, 'NDA not found');
  nda.status = 'ARCHIVED';
  nda.notes = reason || nda.notes;
  const updated = await nda.save();

  await auditService.createAuditLog({
    action: 'ARCHIVE_NDA',
    resourceType: 'NDA',
    resourceId: updated._id,
    performedBy: actor.name,
    performedById: actor.id,
    details: { reason },
  });

  return updated;
};

const expireOverdueNdas = async () => {
  const now = new Date();
  const overdue = await NDA.find({ expiresAt: { $lte: now }, status: { $in: ['DRAFT', 'PENDING_SIGNATURE', 'SIGNED'] } });
  for (const nda of overdue) {
    nda.status = 'EXPIRED';
    await nda.save();
    await auditService.createAuditLog({
      action: 'EXPIRE_NDA',
      resourceType: 'NDA',
      resourceId: nda._id,
      performedBy: 'System',
      performedById: null,
      details: { expiresAt: nda.expiresAt },
    });
    if (nda.candidateEmail) {
      await sendNdaEmail(nda.candidateEmail, {
        name: nda.candidateName || 'Candidate',
        ndaTitle: nda.title,
        status: nda.status,
        note: 'Your NDA has expired due to missed deadline.',
        actionUrl: config.getDocumentsUrl(),
      });
    }
  }
};

module.exports = {
  getAllNdas,
  getNdaById,
  createNda,
  updateNda,
  deleteNda,
  signNda,
  approveNda,
  rejectNda,
  expireNda,
  archiveNda,
  expireOverdueNdas,
};
