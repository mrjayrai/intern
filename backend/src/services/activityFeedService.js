const WorkflowHistory = require('../models/WorkflowHistory');
const Referral = require('../models/Referral');
const NDA = require('../models/NDA');
const Certificate = require('../models/Certificate');
const AccessProvision = require('../models/AccessProvision');

// Build a unified activity feed by aggregating history and important resources
const buildActivityFeed = async ({ candidateId, limit = 200, since } = {}) => {
  const match = {};
  if (candidateId) {
    // candidateId may be stored on Referral; find all referrals for candidate
    const referrals = await Referral.find({ candidateEmail: { $exists: true }, candidateId }).lean().select('_id');
    const referralIds = referrals.map((r) => r._id);
    if (referralIds.length) match.referralId = { $in: referralIds };
  }
  if (since) match.createdAt = { $gte: new Date(since) };

  const events = await WorkflowHistory.find(match)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  // lightweight enrichment for common event types
  const enriched = events.map((e) => ({
    id: e._id,
    type: e.action || 'WORKFLOW',
    referralId: e.referralId,
    onboardingId: e.onboardingId,
    stage: e.workflowStage,
    previousStage: e.previousStage,
    actor: { id: e.actorId, name: e.actorName, role: e.actorRole },
    notes: e.notes,
    metadata: e.metadata,
    durationInStage: e.durationInStage,
    createdAt: e.createdAt,
  }));

  return enriched;
};

module.exports = {
  buildActivityFeed,
};
