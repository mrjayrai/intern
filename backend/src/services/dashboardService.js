const mongoose = require('mongoose');
const Referral = require('../models/Referral');
const AuditLog = require('../models/AuditLog');
const WorkflowHistory = require('../models/WorkflowHistory');
const { WORKFLOW_STAGES } = require('../constants/workflowStages');

const DEFAULT_ACTIVITY_LIMIT = 50;

const buildPastMonthsPipeline = (months = 12) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  return [
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ];
};

const getDashboardMetrics = async () => {
  const now = new Date();

  // Use a single aggregation with facets to reduce collection scans
  const pipeline = [
    {
      $facet: {
        total: [{ $count: 'value' }],
        byStage: [
          { $group: { _id: '$workflowStage', count: { $sum: 1 } } },
        ],
        slaBreaches: [
          { $match: { slaDeadline: { $exists: true, $lt: now }, workflowStage: { $nin: [WORKFLOW_STAGES.COMPLETED, WORKFLOW_STAGES.CLOSED] } } },
          { $count: 'value' },
        ],
        monthlyTrends: buildPastMonthsPipeline(12),
      },
    },
  ];

  const [result] = await Referral.aggregate(pipeline).allowDiskUse(true);

  const totalReferrals = (result.total && result.total[0] && result.total[0].value) || 0;

  const stageMap = (result.byStage || []).reduce((acc, s) => {
    acc[s._id] = s.count;
    return acc;
  }, {});

  const metrics = {
    totalReferrals,
    activeInternships: stageMap[WORKFLOW_STAGES.ACTIVE] || 0,
    onboardingPending: (stageMap[WORKFLOW_STAGES.JOINING_FORM_PENDING] || 0)
      + (stageMap[WORKFLOW_STAGES.NON_WORKER_ID_PENDING] || 0)
      + (stageMap[WORKFLOW_STAGES.ACCESS_PROVISIONING] || 0)
      + (stageMap[WORKFLOW_STAGES.READY_TO_START] || 0),
    ndaPending: stageMap[WORKFLOW_STAGES.NDA_PENDING] || 0,
    slaBreaches: (result.slaBreaches && result.slaBreaches[0] && result.slaBreaches[0].value) || 0,
    certificatesIssued: stageMap[WORKFLOW_STAGES.CERTIFICATE_ISSUED] || 0,
  };

  // Format monthly trends into an ordered array of { year, month, count }
  const monthly = (result.monthlyTrends || []).map((d) => ({ year: d._id.year, month: d._id.month, count: d.count }));

  return { metrics, monthlyTrends: monthly, funnel: stageMap };
};

const getActivityFeed = async (limit = DEFAULT_ACTIVITY_LIMIT) => {
  // recent audit logs with lightweight info and populated performer id
  return AuditLog.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-details')
    .populate('performedById', 'name email')
    .lean();
};

const getWorkflowFunnel = async () => {
  const pipeline = [
    { $group: { _id: '$workflowStage', count: { $sum: 1 } } },
    { $project: { stage: '$_id', count: 1, _id: 0 } },
  ];

  const rows = await Referral.aggregate(pipeline).allowDiskUse(true);
  const funnel = {};
  Object.values(WORKFLOW_STAGES).forEach((s) => { funnel[s] = 0; });
  rows.forEach((r) => { funnel[r.stage] = r.count; });
  return funnel;
};

const getMonthlyReferralTrends = async (months = 12) => {
  const pipeline = buildPastMonthsPipeline(months);
  const rows = await Referral.aggregate(pipeline).allowDiskUse(true);
  return rows.map((d) => ({ year: d._id.year, month: d._id.month, count: d.count }));
};

module.exports = {
  getDashboardMetrics,
  getActivityFeed,
  getWorkflowFunnel,
  getMonthlyReferralTrends,
};
