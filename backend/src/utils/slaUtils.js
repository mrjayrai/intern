const { WORKFLOW_SLA_DAYS } = require('../constants/workflowStages');

const isOverdue = (deadline) => {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
};

const timeRemainingSeconds = (deadline) => {
  if (!deadline) return null;
  return Math.floor((new Date(deadline) - new Date()) / 1000);
};

const escalationThresholds = (stage) => {
  // simple thresholds: 50% and 80% of SLA duration
  const days = WORKFLOW_SLA_DAYS[stage] || 0;
  const seconds = days * 24 * 3600;
  return { warnAt: Math.floor(seconds * 0.5), escalateAt: Math.floor(seconds * 0.8) };
};

module.exports = { isOverdue, timeRemainingSeconds, escalationThresholds };
