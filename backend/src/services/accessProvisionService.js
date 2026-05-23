const mongoose = require('mongoose');
const AccessProvision = require('../models/AccessProvision');
const auditService = require('./auditService');
const notificationService = require('./notificationService');
const emailService = require('./emailService');
const workflowService = require('./workflowService');
const Referral = require('../models/Referral');
const ApiError = require('../utils/apiError');
const { WORKFLOW_STAGES } = require('../constants/workflowStages');

const createProvision = async (data = {}, user = {}) => {
  const payload = {
    referralId: data.referralId,
    candidateId: data.candidateId,
    adAccountCreated: false,
    emailProvisioned: false,
    vpnAccess: false,
    badgeAccess: false,
    systemAccess: Array.isArray(data.systemAccess) ? data.systemAccess.slice() : [],
    otpSent: false,
    provisioningStatus: 'NOT_STARTED',
    slaDeadline: data.slaDeadline || workflowService.computeSlaDeadline(WORKFLOW_STAGES.ACCESS_PROVISIONING),
    notes: data.notes || '',
    createdBy: user.id,
    updatedBy: user.id,
  };

  const rec = new AccessProvision(payload);
  await rec.save();

  await auditService.createAuditLog({ action: 'CREATE', resourceType: 'AccessProvision', resourceId: rec._id, performedBy: user.name, performedById: user.id, details: {} });

  // notify IT/admin
  try {
    if (rec.createdBy) {
      await notificationService.createNotification({ user: rec.createdBy, title: 'Provisioning requested', message: `Access provisioning requested for ${data.candidateName || ''}` });
    }
  } catch (err) {
    console.error('notify error', err.message || err);
  }

  return rec;
};

const listProvisions = async (filters = {}, opts = {}) => {
  const query = {};
  if (filters.candidateId && mongoose.Types.ObjectId.isValid(filters.candidateId)) query.candidateId = filters.candidateId;
  if (filters.provisioningStatus) query.provisioningStatus = filters.provisioningStatus;

  const docs = await AccessProvision.find(query).sort({ createdAt: -1 }).limit(opts.limit || 100).lean();
  return docs;
};

const getById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, 'Invalid id');
  const rec = await AccessProvision.findById(id);
  if (!rec) throw new ApiError(404, 'AccessProvision not found');
  return rec;
};

const updateProvision = async (id, data = {}, user = {}) => {
  const rec = await AccessProvision.findById(id);
  if (!rec) throw new ApiError(404, 'AccessProvision not found');

  // allow updating boolean flags and notes
  ['adAccountCreated', 'emailProvisioned', 'vpnAccess', 'badgeAccess', 'otpSent'].forEach((k) => {
    if (data[k] !== undefined) rec[k] = !!data[k];
  });

  if (data.systemAccess && Array.isArray(data.systemAccess)) rec.systemAccess = data.systemAccess.slice();
  if (data.notes !== undefined) rec.notes = data.notes;
  if (data.provisioningStatus && ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'].includes(data.provisioningStatus)) rec.provisioningStatus = data.provisioningStatus;
  if (data.slaDeadline !== undefined) rec.slaDeadline = data.slaDeadline;

  rec.updatedBy = user.id;
  await rec.save();

  await auditService.createAuditLog({ action: 'UPDATE', resourceType: 'AccessProvision', resourceId: rec._id, performedBy: user.name, performedById: user.id, details: { changes: data } });
  return rec;
};

const startProvision = async (id, user = {}) => {
  const rec = await AccessProvision.findById(id);
  if (!rec) throw new ApiError(404, 'AccessProvision not found');
  if (rec.provisioningStatus === 'COMPLETED') throw new ApiError(400, 'Already completed');

  rec.provisioningStatus = 'IN_PROGRESS';
  rec.updatedBy = user.id;
  await rec.save();

  await auditService.createAuditLog({ action: 'START', resourceType: 'AccessProvision', resourceId: rec._id, performedBy: user.name, performedById: user.id, details: {} });
  return rec;
};

const completeProvision = async (id, user = {}) => {
  const rec = await AccessProvision.findById(id);
  if (!rec) throw new ApiError(404, 'AccessProvision not found');
  rec.provisioningStatus = 'COMPLETED';
  rec.completedAt = new Date();
  rec.updatedBy = user.id;
  await rec.save();

  await auditService.createAuditLog({ action: 'COMPLETE', resourceType: 'AccessProvision', resourceId: rec._id, performedBy: user.name, performedById: user.id, details: {} });

  // transition referral to READY_TO_START if workflow allows
  try {
    if (rec.referralId) {
      const referral = await Referral.findById(rec.referralId);
      if (referral && workflowService.validateTransition(referral.workflowStage, WORKFLOW_STAGES.READY_TO_START)) {
        await workflowService.transitionReferralStage(referral, WORKFLOW_STAGES.READY_TO_START, { name: user.name, id: user.id }, 'Access provisioning completed');
      }
    }
  } catch (err) {
    console.error('workflow transition after access complete failed', err.message || err);
  }

  return rec;
};

const findSlaBreaches = async () => {
  const now = new Date();
  return AccessProvision.find({ slaDeadline: { $exists: true, $lt: now }, provisioningStatus: { $in: ['NOT_STARTED', 'IN_PROGRESS'] } }).lean();
};

module.exports = { createProvision, listProvisions, getById, updateProvision, startProvision, completeProvision, findSlaBreaches };
