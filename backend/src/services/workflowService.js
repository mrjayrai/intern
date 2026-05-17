const { WORKFLOW_TRANSITIONS, WORKFLOW_STAGES, WORKFLOW_SLA_DAYS } = require('../constants/workflowStages');
const WorkflowHistory = require('../models/WorkflowHistory');
const NDA = require('../models/NDA');
const notificationService = require('./notificationService');
const ApiError = require('../utils/apiError');

const isValidStage = (stage) => Object.values(WORKFLOW_STAGES).includes(stage);

const getAllowedTransitions = (currentStage) => {
  if (!currentStage) return [];
  return WORKFLOW_TRANSITIONS[currentStage] || [];
};

const validateTransition = (currentStage, nextStage) => {
  if (!currentStage || !nextStage) return false;
  if (currentStage === nextStage) return true;
  return getAllowedTransitions(currentStage).includes(nextStage);
};

const computeSlaDeadline = (stage, baseDate = new Date()) => {
  if (!stage || !WORKFLOW_SLA_DAYS[stage]) return undefined;
  const deadline = new Date(baseDate);
  deadline.setDate(deadline.getDate() + WORKFLOW_SLA_DAYS[stage]);
  return deadline;
};

const buildWorkflowHistoryEntry = async ({ referralId, fromStage, toStage, performedBy, performedById, note, slaDeadline }) => {
  const entry = new WorkflowHistory({
    referralId,
    fromStage,
    toStage,
    performedBy,
    performedById,
    note,
    slaDeadline,
  });

  return entry.save();
};

const transitionReferralStage = async (referral, nextStage, actor = {}, note = '', explicitSlaDeadline) => {
  if (!referral) {
    throw new ApiError(404, 'Referral not found');
  }

  const currentStage = referral.workflowStage;
  if (!isValidStage(nextStage)) {
    throw new ApiError(400, 'Invalid workflow stage');
  }

  if (!validateTransition(currentStage, nextStage)) {
    throw new ApiError(400, `Invalid workflow transition from ${currentStage} to ${nextStage}`);
  }

  // Enforce NDA-signed requirement for stages that should not be reachable before NDA is signed
  const requireNdaStages = [WORKFLOW_STAGES.READY_TO_START, WORKFLOW_STAGES.ACTIVE];
  if (requireNdaStages.includes(nextStage)) {
    const nda = await NDA.findOne({ referral: referral._id, archived: { $ne: true } }).sort({ createdAt: -1 });
    if (!nda || !nda.signed) {
      throw new ApiError(400, 'NDA must be signed before moving to this stage');
    }
  }

  const slaDeadline = explicitSlaDeadline ? new Date(explicitSlaDeadline) : computeSlaDeadline(nextStage, new Date());
  referral.workflowStage = nextStage;
  referral.slaDeadline = slaDeadline;

  await referral.save();
  await buildWorkflowHistoryEntry({
    referralId: referral._id,
    fromStage: currentStage,
    toStage: nextStage,
    performedBy: actor.name,
    performedById: actor.id,
    note,
    slaDeadline,
  });

  try {
    const recipientId = referral.referrer || referral.mentor || actor.id;
    if (recipientId) {
      await notificationService.createNotification({
        user: recipientId,
        title: `Workflow updated to ${nextStage}`,
        message: `Referral for ${referral.candidateName} moved from ${currentStage || 'NONE'} to ${nextStage}.`,
        type: 'WORKFLOW',
        workflowStage: nextStage,
        metadata: {
          referralId: referral._id,
          fromStage: currentStage,
          toStage: nextStage,
          note,
        },
        performedByName: actor.name || 'System',
        performedById: actor.id,
      });
    }
  } catch (notificationError) {
    console.error('Failed to create workflow notification:', notificationError?.message || notificationError);
  }

  return referral;
};

const getWorkflowHistory = async (referralId) => WorkflowHistory.find({ referralId }).sort({ createdAt: 1 });

module.exports = {
  WORKFLOW_STAGES,
  isValidStage,
  validateTransition,
  getAllowedTransitions,
  computeSlaDeadline,
  transitionReferralStage,
  getWorkflowHistory,
};
