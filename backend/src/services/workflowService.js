const { WORKFLOW_TRANSITIONS, WORKFLOW_STAGES, WORKFLOW_SLA_DAYS } = require('../constants/workflowStages');
const WorkflowHistory = require('../models/WorkflowHistory');
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
