const WorkflowHistory = require('../models/WorkflowHistory');
const Referral = require('../models/Referral');
const AuditService = require('./auditService');
const notificationService = require('./notificationService');

const recordTransition = async ({ referralId, onboardingId, workflowStage, previousStage, actorId, actorName, actorRole, action, notes, metadata }) => {
  const now = new Date();

  // compute duration spent in previousStage using latest history entry when previousStage was entered
  let durationInSeconds = null;
  if (referralId && previousStage) {
    const lastPrevious = await WorkflowHistory.findOne({ referralId, workflowStage: previousStage }).sort({ createdAt: -1 }).lean();
    if (lastPrevious && lastPrevious.createdAt) {
      durationInSeconds = Math.floor((now - new Date(lastPrevious.createdAt)) / 1000);
    }
  }

  const entry = new WorkflowHistory({
    referralId,
    onboardingId,
    workflowStage,
    previousStage,
    actorId,
    actorName,
    actorRole,
    action,
    notes,
    metadata,
    durationInStage: durationInSeconds,
  });

  const saved = await entry.save();

  // SLA breach check - if referral has slaDeadline and it's passed
  try {
    if (referralId) {
      const ref = await Referral.findById(referralId).lean();
      if (ref && ref.slaDeadline && new Date(ref.slaDeadline) < new Date()) {
        await AuditService.createAuditLog({
          action: 'SLA_BREACH',
          resourceType: 'Referral',
          resourceId: referralId,
          performedBy: actorName || 'system',
          performedById: actorId,
          details: { message: 'SLA missed during transition', workflowStage, previousStage },
        });
      }
    }
  } catch (err) {
    console.error('Failed SLA/audit check in trackingService:', err?.message || err);
  }

  // notify interested parties for important actions
  try {
    if (['ONBOARDING_STARTED', 'ONBOARDING_SUBMITTED', 'ONBOARDING_APPROVED', 'REFERRAL_CREATED', 'ACCESS_STARTED', 'ACCESS_COMPLETED', 'CERTIFICATE_ISSUED', 'ID_GENERATED', 'WORKFLOW_ESCALATION'].includes(action)) {
      const recipient = (metadata && metadata.notifyUser) || (referralId && (metadata?.referrer || metadata?.mentor));
      if (recipient) {
        await notificationService.createNotification({
          user: recipient,
          title: `Activity: ${action}`,
          message: notes || `${actorName || 'System'} performed ${action}`,
          type: 'ACTIVITY',
          metadata: { referralId, onboardingId, action },
          performedByName: actorName,
          performedById: actorId,
        });
      }
    }
  } catch (nerr) {
    console.error('Failed to send tracking notification:', nerr?.message || nerr);
  }

  return saved;
};

const getWorkflowHistory = async (referralId) => WorkflowHistory.find({ referralId }).sort({ createdAt: 1 }).lean();

const getActivityFeed = async ({ limit = 100, since } = {}) => {
  const q = {};
  if (since) q.createdAt = { $gte: new Date(since) };
  return WorkflowHistory.find(q)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Build a structured workflow timeline for frontend consumption
 * Transforms raw history entries into a timeline with current status
 */
const buildWorkflowTimeline = async (referralId) => {
  const referral = await Referral.findById(referralId).lean();
  if (!referral) return null;

  const historyEntries = await WorkflowHistory.find({ referralId }).sort({ createdAt: 1 }).lean();

  // Build timeline from history entries
  const timeline = historyEntries.map((entry) => {
    const now = new Date();
    const slaDeadline = entry.metadata?.slaDeadline ? new Date(entry.metadata.slaDeadline) : null;
    const isOverdue = slaDeadline && slaDeadline < now;

    // Determine status based on whether this is the current stage
    let status = 'completed';
    if (entry.workflowStage === referral.workflowStage) {
      status = isOverdue ? 'overdue' : 'in_progress';
    }

    return {
      stage: entry.workflowStage,
      status,
      actor: entry.actorName,
      role: entry.actorRole,
      timestamp: entry.createdAt,
      durationMinutes: entry.durationInStage ? Math.round(entry.durationInStage / 60) : undefined,
      slaDeadline: slaDeadline ? slaDeadline.toISOString() : undefined,
      notes: entry.notes,
      meta: entry.metadata,
    };
  });

  // Determine overall workflow status
  const now = new Date();
  const slaOverdue = referral.slaDeadline && new Date(referral.slaDeadline) < now;
  const workflowStatus = slaOverdue ? 'delayed' : 'active';

  return {
    _id: referral._id,
    referralId: referral._id,
    candidateId: referral.candidateId,
    candidateName: referral.candidateName,
    candidateEmail: referral.candidateEmail,
    workflowStage: referral.workflowStage,
    workflowStatus,
    startedAt: referral.createdAt,
    updatedAt: referral.updatedAt,
    actor: historyEntries.length > 0 ? historyEntries[historyEntries.length - 1].actorName : undefined,
    timeline,
    slaDeadline: referral.slaDeadline,
    escalationLevel: slaOverdue ? 'watch' : 'none',
  };
};

module.exports = {
  recordTransition,
  getWorkflowHistory,
  getActivityFeed,
  buildWorkflowTimeline,
};
