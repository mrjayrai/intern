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
  console.log(`[AccessProvision] Creating access provision for candidate ${data.candidateName || data.candidateId}`);

  // RULE 2 & 4: Strict validation - ONE ACTIVE provision per candidate
  const blockedStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];

  console.log(`[PROVISIONING_VALIDATION] Checking for existing provisions for candidate ${data.candidateId}`);

  const existingProvision = await AccessProvision.findOne({
    candidateId: data.candidateId,
    provisioningStatus: { $in: blockedStatuses }
  }).sort({ createdAt: -1 }).lean();

  if (existingProvision) {
    const errorMsg = `Cannot create Access Provision. An active provision already exists with status: ${existingProvision.provisioningStatus}. Provision ID: ${existingProvision._id}`;
    console.error(`[PROVISIONING_VALIDATION] BLOCKED: ${errorMsg}`);
    throw new ApiError(409, errorMsg);
  }

  console.log(`[PROVISIONING_VALIDATION] Validation passed. Creating new provision for ${data.candidateName}`);

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

  console.log(`[AccessProvision] Access provision created with ID ${rec._id}`);

  await auditService.createAuditLog({ action: 'CREATE', resourceType: 'AccessProvision', resourceId: rec._id, performedBy: user.name, performedById: user.id, details: { candidateId: data.candidateId } });

  // Transition referral to ACCESS_PROVISIONING stage when provision is created
  try {
    if (rec.referralId) {
      const referral = await Referral.findById(rec.referralId);
      if (referral && workflowService.validateTransition(referral.workflowStage, WORKFLOW_STAGES.ACCESS_PROVISIONING)) {
        console.log(`[AccessProvision] Transitioning referral ${referral._id} to ACCESS_PROVISIONING stage`);
        await workflowService.transitionReferralStage(referral, WORKFLOW_STAGES.ACCESS_PROVISIONING, { name: user.name || 'System', id: user.id }, 'Access provisioning initiated');
      }
    }
  } catch (err) {
    console.error('[AccessProvision] Failed to transition workflow stage:', err.message || err);
  }

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

  console.log(`[AccessProvision] Starting access provisioning for ID ${id}`);

  rec.provisioningStatus = 'IN_PROGRESS';
  rec.updatedBy = user.id;
  await rec.save();

  await auditService.createAuditLog({ action: 'START', resourceType: 'AccessProvision', resourceId: rec._id, performedBy: user.name, performedById: user.id, details: { status: 'IN_PROGRESS' } });

  try {
    // Look up candidate email via referral if available
    if (rec.referralId) {
      console.log(`[AccessProvision] Looking up referral ${rec.referralId} for email notification`);
      const referral = await Referral.findById(rec.referralId).lean();

      if (!referral) {
        console.warn(`[AccessProvision] Referral ${rec.referralId} not found, skipping email`);
      } else if (!referral.candidateEmail) {
        console.warn(`[AccessProvision] Referral ${rec.referralId} has no candidateEmail, skipping email`);
      } else {
        console.log(`[AccessProvision] Queueing provisioning started email for ${referral.candidateEmail}`);
        await emailService.enqueueEmail(referral.candidateEmail, 'accessProvisioningStarted', {
          name: referral.candidateName || '',
          systems: rec.systemAccess || [],
        });

        console.log(`[AccessProvision] Email queued, triggering queue processing`);

        // Trigger email queue processing (non-blocking)
        emailService.processQueue(10).catch((queueErr) => {
          console.error('[AccessProvision] Email queue processing error:', queueErr?.message || queueErr);
        });

        console.log(`[AccessProvision] ✅ Provisioning started email queued successfully`);
      }
    } else {
      console.warn(`[AccessProvision] No referralId on provision ${rec._id}, skipping email`);
    }
  } catch (err) {
    console.error('[AccessProvision] Failed to send accessProvisioningStarted email:', err.message || err);
    console.error('[AccessProvision] Error stack:', err.stack);
  }

  return rec;
};

const completeProvision = async (id, user = {}) => {
  const rec = await AccessProvision.findById(id);
  if (!rec) throw new ApiError(404, 'AccessProvision not found');

  console.log(`[AccessProvision] Completing access provisioning for ID ${id}`);

  rec.provisioningStatus = 'COMPLETED';
  rec.completedAt = new Date();
  rec.updatedBy = user.id;
  await rec.save();

  await auditService.createAuditLog({ action: 'COMPLETE', resourceType: 'AccessProvision', resourceId: rec._id, performedBy: user.name, performedById: user.id, details: { completedAt: rec.completedAt } });

  try {
    if (rec.referralId) {
      console.log(`[AccessProvision] Looking up referral ${rec.referralId} for completion email notification`);
      const referral = await Referral.findById(rec.referralId).lean();

      if (!referral) {
        console.warn(`[AccessProvision] Referral ${rec.referralId} not found, skipping completion email`);
      } else if (!referral.candidateEmail) {
        console.warn(`[AccessProvision] Referral ${rec.referralId} has no candidateEmail, skipping completion email`);
      } else {
        console.log(`[AccessProvision] Queueing provisioning completed email for ${referral.candidateEmail}`);
        await emailService.enqueueEmail(referral.candidateEmail, 'accessProvisioningCompleted', {
          name: referral.candidateName || '',
          systems: rec.systemAccess || [],
          adAccountCreated: rec.adAccountCreated,
          emailProvisioned: rec.emailProvisioned,
          vpnAccess: rec.vpnAccess,
          badgeAccess: rec.badgeAccess,
          otpSent: rec.otpSent,
        });

        console.log(`[AccessProvision] Completion email queued, triggering queue processing`);

        // Trigger email queue processing (non-blocking)
        emailService.processQueue(10).catch((queueErr) => {
          console.error('[AccessProvision] Email queue processing error:', queueErr?.message || queueErr);
        });

        console.log(`[AccessProvision] ✅ Provisioning completed email queued successfully`);
      }
    } else {
      console.warn(`[AccessProvision] No referralId on provision ${rec._id}, skipping completion email`);
    }
  } catch (err) {
    console.error('[AccessProvision] Failed to send accessProvisioningCompleted email:', err.message || err);
    console.error('[AccessProvision] Error stack:', err.stack);
  }

  // RULE 5: Direct transition ACCESS_PROVISIONING → ACTIVE (ACTIVE_INTERNSHIP)
  try {
    if (rec.referralId) {
      const referral = await Referral.findById(rec.referralId);
      if (referral) {
        console.log(`[ACTIVE_INTERNSHIP_TRIGGER] Workflow transition starting for referral ${referral._id} | Current stage: ${referral.workflowStage}`);

        // Direct transition to ACTIVE (skip READY_TO_START per business rules)
        if (referral.workflowStage === WORKFLOW_STAGES.ACCESS_PROVISIONING) {
          // Must go through READY_TO_START due to workflow constraints, but make it instant
          if (workflowService.validateTransition(referral.workflowStage, WORKFLOW_STAGES.READY_TO_START)) {
            await workflowService.transitionReferralStage(referral, WORKFLOW_STAGES.READY_TO_START, { name: user.name, id: user.id }, 'Access provisioning completed');
            console.log(`[ACTIVE_INTERNSHIP_TRIGGER] Transitioned to READY_TO_START`);

            // Reload to get updated stage
            await referral.reload();
          }

          // Immediate transition to ACTIVE
          if (workflowService.validateTransition(referral.workflowStage, WORKFLOW_STAGES.ACTIVE)) {
            await workflowService.transitionReferralStage(referral, WORKFLOW_STAGES.ACTIVE, { name: 'System', id: user.id }, 'ACTIVE_INTERNSHIP - All onboarding complete');
            console.log(`[ACTIVE_INTERNSHIP_TRIGGER] ✅ Internship activated - ACTIVE_INTERNSHIP state reached`);
          }
        } else {
          console.warn(`[ACTIVE_INTERNSHIP_TRIGGER] Cannot transition - current stage is ${referral.workflowStage}, expected ACCESS_PROVISIONING`);
        }
      }
    }
  } catch (err) {
    console.error('[ACTIVE_INTERNSHIP_TRIGGER] Workflow transition failed:', err.message || err);
  }

  return rec;
};

const findSlaBreaches = async () => {
  const now = new Date();
  return AccessProvision.find({ slaDeadline: { $exists: true, $lt: now }, provisioningStatus: { $in: ['NOT_STARTED', 'IN_PROGRESS'] } }).lean();
};

module.exports = { createProvision, listProvisions, getById, updateProvision, startProvision, completeProvision, findSlaBreaches };
