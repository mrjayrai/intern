const mongoose = require('mongoose');
const NonWorkerId = require('../models/NonWorkerId');
const auditService = require('./auditService');
const notificationService = require('./notificationService');
const emailService = require('./emailService');
const workflowService = require('./workflowService');
const Referral = require('../models/Referral');
const ApiError = require('../utils/apiError');
const { WORKFLOW_STAGES } = require('../constants/workflowStages');

const createRequest = async (data = {}, user = {}) => {
  const payload = {
    referralId: data.referralId,
    candidateId: data.candidateId,
    candidateName: data.candidateName,
    candidateEmail: data.candidateEmail,
    employeeId: data.employeeId,
    requestStatus: 'PENDING',
    requestedAt: new Date(),
    slaDeadline: data.slaDeadline || workflowService.computeSlaDeadline(WORKFLOW_STAGES.NON_WORKER_ID_PENDING),
    notes: data.notes || '',
    createdBy: user.id,
    updatedBy: user.id,
  };

  const rec = new NonWorkerId(payload);
  await rec.save();

  await auditService.createAuditLog({
    action: 'CREATE',
    resourceType: 'NonWorkerId',
    resourceId: rec._id,
    performedBy: user.name,
    performedById: user.id,
    details: { requestStatus: rec.requestStatus },
  });

  // transition referral stage if applicable
  if (rec.referralId) {
    const referral = await Referral.findById(rec.referralId);
    if (referral && workflowService.validateTransition(referral.workflowStage, WORKFLOW_STAGES.NON_WORKER_ID_PENDING)) {
      await workflowService.transitionReferralStage(referral, WORKFLOW_STAGES.NON_WORKER_ID_PENDING, { name: user.name, id: user.id }, 'Non-worker ID requested');
    }
  }

  // notification/email
  try {
    if (rec.createdBy) {
      await notificationService.createNotification({ user: rec.createdBy, title: 'ID Requested', message: `Non-worker ID requested for ${rec.candidateName}` });
    }
    if (rec.candidateEmail) {
      await emailService.enqueueEmail(rec.candidateEmail, 'nonWorkerIdConfirmation', {
        name: rec.candidateName,
        requestId: rec._id.toString(),
        referralId: rec.referralId ? rec.referralId.toString() : '',
        slaDeadline: rec.slaDeadline ? new Date(rec.slaDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      });
    }
  } catch (err) {
    // non-fatal
    console.error('notification/email error', err.message || err);
  }

  return rec;
};

const listRequests = async (filters = {}, opts = {}) => {
  const query = {};
  if (filters.candidateId && mongoose.Types.ObjectId.isValid(filters.candidateId)) query.candidateId = filters.candidateId;
  if (filters.requestStatus) query.requestStatus = filters.requestStatus;

  const docs = await NonWorkerId.find(query).sort({ createdAt: -1 }).limit(opts.limit || 100).lean();
  return docs;
};

const getById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, 'Invalid id');
  const rec = await NonWorkerId.findById(id);
  if (!rec) throw new ApiError(404, 'NonWorkerId not found');
  return rec;
};

const updateRequest = async (id, data = {}, user = {}) => {
  const rec = await NonWorkerId.findById(id);
  if (!rec) throw new ApiError(404, 'NonWorkerId not found');

  // allow partial updates for notes, employeeId
  if (data.notes !== undefined) rec.notes = data.notes;
  if (data.employeeId !== undefined) rec.employeeId = data.employeeId;
  if (data.slaDeadline !== undefined) rec.slaDeadline = data.slaDeadline;

  rec.updatedBy = user.id;
  await rec.save();

  await auditService.createAuditLog({ action: 'UPDATE', resourceType: 'NonWorkerId', resourceId: rec._id, performedBy: user.name, performedById: user.id, details: { changes: data } });
  return rec;
};

const approveRequest = async (id, user = {}, comment = '') => {
  const rec = await NonWorkerId.findById(id);
  if (!rec) throw new ApiError(404, 'NonWorkerId not found');
  if (rec.requestStatus !== 'PENDING') throw new ApiError(400, 'Only pending requests can be approved');

  rec.requestStatus = 'APPROVED';
  rec.approvedAt = new Date();
  rec.updatedBy = user.id;
  if (comment) rec.notes = `${rec.notes || ''}\n[approve] ${comment}`.trim();
  await rec.save();

  await auditService.createAuditLog({ action: 'APPROVE', resourceType: 'NonWorkerId', resourceId: rec._id, performedBy: user.name, performedById: user.id, details: {} });

  try {
    if (rec.candidateEmail) {
      await emailService.enqueueEmail(rec.candidateEmail, 'nonWorkerIdApproved', {
        name: rec.candidateName,
        requestId: rec._id.toString(),
        approvedBy: user.name || 'HR Team',
        comment: comment || '',
      });
    }
  } catch (err) {
    console.error('Failed to send nonWorkerIdApproved email', err.message || err);
  }

  // start access provisioning when ID approved
  try {
    const accessService = require('./accessProvisionService');
    await accessService.createProvision({ referralId: rec.referralId, candidateId: rec.candidateId, candidateName: rec.candidateName }, user);
  } catch (err) {
    console.error('Failed to create access provision after ID approve', err.message || err);
  }

  return rec;
};

const rejectRequest = async (id, user = {}, reason = '') => {
  const rec = await NonWorkerId.findById(id);
  if (!rec) throw new ApiError(404, 'NonWorkerId not found');
  if (rec.requestStatus !== 'PENDING') throw new ApiError(400, 'Only pending requests can be rejected');

  rec.requestStatus = 'REJECTED';
  rec.rejectedAt = new Date();
  rec.updatedBy = user.id;
  if (reason) rec.notes = `${rec.notes || ''}\n[reject] ${reason}`.trim();
  await rec.save();

  await auditService.createAuditLog({ action: 'REJECT', resourceType: 'NonWorkerId', resourceId: rec._id, performedBy: user.name, performedById: user.id, details: { reason } });

  try {
    if (rec.candidateEmail) {
      await emailService.enqueueEmail(rec.candidateEmail, 'nonWorkerIdRejected', {
        name: rec.candidateName,
        requestId: rec._id.toString(),
        reason: reason || '',
        rejectedBy: user.name || 'HR Team',
      });
    }
  } catch (err) {
    console.error('Failed to send nonWorkerIdRejected email', err.message || err);
  }

  return rec;
};

const completeRequest = async (id, user = {}) => {
  const rec = await NonWorkerId.findById(id);
  if (!rec) throw new ApiError(404, 'NonWorkerId not found');
  if (!['APPROVED'].includes(rec.requestStatus)) throw new ApiError(400, 'Only approved requests can be completed');

  rec.requestStatus = 'COMPLETED';
  rec.completedAt = new Date();
  rec.updatedBy = user.id;
  await rec.save();

  await auditService.createAuditLog({ action: 'COMPLETE', resourceType: 'NonWorkerId', resourceId: rec._id, performedBy: user.name, performedById: user.id, details: {} });

  // on complete -> ensure access provisioning is started
  try {
    const accessService = require('./accessProvisionService');
    await accessService.createProvision({ referralId: rec.referralId, candidateId: rec.candidateId, candidateName: rec.candidateName }, user);
  } catch (err) {
    console.error('Failed to create access provision after ID complete', err.message || err);
  }

  return rec;
};

const findSlaBreaches = async () => {
  const now = new Date();
  return NonWorkerId.find({ slaDeadline: { $exists: true, $lt: now }, requestStatus: { $in: ['PENDING'] } }).lean();
};

module.exports = { createRequest, listRequests, getById, updateRequest, approveRequest, rejectRequest, completeRequest, findSlaBreaches };
