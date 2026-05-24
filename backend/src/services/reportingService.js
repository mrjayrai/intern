const mongoose = require('mongoose');
const Referral = require('../models/Referral');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const WorkflowHistory = require('../models/WorkflowHistory');
const AccessProvision = require('../models/AccessProvision');
const NonWorkerId = require('../models/NonWorkerId');
const JoiningForm = require('../models/JoiningForm');
const NDA = require('../models/NDA');
const Certificate = require('../models/Certificate');
const { WORKFLOW_STAGES } = require('../constants/workflowStages');
const { ROLES } = require('../constants/roles');

const buildDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate) filter.$gte = new Date(startDate);
  if (endDate) {
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);
    filter.$lte = endDateObj;
  }
  return Object.keys(filter).length > 0 ? { createdAt: filter } : {};
};

/**
 * Get overview metrics - high-level dashboard statistics
 */
const getOverviewMetrics = async (filters = {}) => {
  const dateFilter = buildDateFilter(filters.startDate, filters.endDate);
  const now = new Date();

  const pipeline = [
    { $match: { ...dateFilter } },
    {
      $facet: {
        total: [{ $count: 'value' }],
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ],
        byStage: [
          { $group: { _id: '$workflowStage', count: { $sum: 1 } } },
        ],
        slaBreaches: [
          {
            $match: {
              slaDeadline: { $exists: true, $lt: now },
              workflowStage: { $nin: [WORKFLOW_STAGES.COMPLETED, WORKFLOW_STAGES.CLOSED] },
            },
          },
          { $count: 'value' },
        ],
        activeInternships: [
          { $match: { workflowStage: WORKFLOW_STAGES.ACTIVE } },
          { $count: 'value' },
        ],
        completedInternships: [
          { $match: { workflowStage: WORKFLOW_STAGES.COMPLETED } },
          { $count: 'value' },
        ],
      },
    },
  ];

  const [result] = await Referral.aggregate(pipeline).allowDiskUse(true);

  const stageMap = (result.byStatus || []).reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  return {
    totalReferrals: (result.total && result.total[0] && result.total[0].value) || 0,
    statusDistribution: stageMap,
    activeInternships: (result.activeInternships && result.activeInternships[0] && result.activeInternships[0].value) || 0,
    completedInternships: (result.completedInternships && result.completedInternships[0] && result.completedInternships[0].value) || 0,
    slaBreaches: (result.slaBreaches && result.slaBreaches[0] && result.slaBreaches[0].value) || 0,
  };
};

/**
 * Get onboarding funnel - track progress through onboarding stages
 */
const getOnboardingFunnel = async (filters = {}) => {
  const dateFilter = buildDateFilter(filters.startDate, filters.endDate);
  const match = { ...dateFilter };

  if (filters.status) {
    match.status = filters.status;
  }

  const stages = [
    WORKFLOW_STAGES.REFERRED,
    WORKFLOW_STAGES.JOINING_FORM_PENDING,
    WORKFLOW_STAGES.NON_WORKER_ID_PENDING,
    WORKFLOW_STAGES.NDA_PENDING,
    WORKFLOW_STAGES.ACCESS_PROVISIONING,
    WORKFLOW_STAGES.READY_TO_START,
    WORKFLOW_STAGES.ACTIVE,
    WORKFLOW_STAGES.COMPLETED,
  ];

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$workflowStage',
        count: { $sum: 1 },
      },
    },
  ];

  const results = await Referral.aggregate(pipeline).allowDiskUse(true);
  const stageMap = {};

  stages.forEach((stage) => {
    stageMap[stage] = 0;
  });

  results.forEach((item) => {
    if (stageMap.hasOwnProperty(item._id)) {
      stageMap[item._id] = item.count;
    }
  });

  // Calculate conversion rates
  const funnel = stages.map((stage, index) => ({
    stage,
    count: stageMap[stage],
    percentage: index === 0 ? 100 : Math.round((stageMap[stage] / stageMap[stages[0]]) * 100),
  }));

  return funnel;
};

/**
 * Get referral conversion metrics
 */
const getReferralConversion = async (filters = {}) => {
  const dateFilter = buildDateFilter(filters.startDate, filters.endDate);
  const match = { ...dateFilter };

  if (filters.department) {
    match.department = filters.department;
  }

  const pipeline = [
    { $match: match },
    {
      $facet: {
        total: [{ $count: 'value' }],
        converted: [
          { $match: { workflowStage: { $in: [WORKFLOW_STAGES.ACTIVE, WORKFLOW_STAGES.COMPLETED] } } },
          { $count: 'value' },
        ],
        rejected: [
          { $match: { status: 'REJECTED' } },
          { $count: 'value' },
        ],
        pending: [
          { $match: { status: 'PENDING' } },
          { $count: 'value' },
        ],
      },
    },
  ];

  const [result] = await Referral.aggregate(pipeline).allowDiskUse(true);

  const total = (result.total && result.total[0] && result.total[0].value) || 0;
  const converted = (result.converted && result.converted[0] && result.converted[0].value) || 0;
  const rejected = (result.rejected && result.rejected[0] && result.rejected[0].value) || 0;
  const pending = (result.pending && result.pending[0] && result.pending[0].value) || 0;

  return {
    total,
    converted,
    rejected,
    pending,
    conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
    rejectionRate: total > 0 ? Math.round((rejected / total) * 100) : 0,
  };
};

/**
 * Get SLA performance metrics
 */
const getSLAMetrics = async (filters = {}) => {
  const dateFilter = buildDateFilter(filters.startDate, filters.endDate);
  const now = new Date();
  const match = { ...dateFilter, slaDeadline: { $exists: true } };

  const pipeline = [
    { $match: match },
    {
      $facet: {
        total: [{ $count: 'value' }],
        onTime: [
          {
            $match: {
              slaDeadline: { $gte: now },
              workflowStage: { $ne: WORKFLOW_STAGES.COMPLETED },
            },
          },
          { $count: 'value' },
        ],
        breached: [
          {
            $match: {
              slaDeadline: { $lt: now },
              workflowStage: { $nin: [WORKFLOW_STAGES.COMPLETED, WORKFLOW_STAGES.CLOSED] },
            },
          },
          { $count: 'value' },
        ],
        completed: [
          { $match: { workflowStage: WORKFLOW_STAGES.COMPLETED } },
          { $count: 'value' },
        ],
      },
    },
  ];

  const [result] = await Referral.aggregate(pipeline).allowDiskUse(true);

  const total = (result.total && result.total[0] && result.total[0].value) || 0;
  const onTime = (result.onTime && result.onTime[0] && result.onTime[0].value) || 0;
  const breached = (result.breached && result.breached[0] && result.breached[0].value) || 0;
  const completed = (result.completed && result.completed[0] && result.completed[0].value) || 0;

  return {
    total,
    onTime,
    breached,
    completed,
    breachRate: total > 0 ? Math.round((breached / total) * 100) : 0,
    complianceRate: total > 0 ? Math.round(((total - breached) / total) * 100) : 0,
  };
};

/**
 * Get workflow bottlenecks - identify stages with slowest progress
 */
const getWorkflowBottlenecks = async (filters = {}) => {
  const dateFilter = buildDateFilter(filters.startDate, filters.endDate);

  const pipeline = [
    { $match: dateFilter },
    {
      $group: {
        _id: '$workflowStage',
        count: { $sum: 1 },
        avgDaysInStage: {
          $avg: {
            $divide: [
              { $subtract: [new Date(), '$createdAt'] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
    },
    { $sort: { avgDaysInStage: -1 } },
    {
      $project: {
        stage: '$_id',
        count: 1,
        avgDaysInStage: { $round: ['$avgDaysInStage', 1] },
        _id: 0,
      },
    },
  ];

  return Referral.aggregate(pipeline).allowDiskUse(true);
};

/**
 * Get internship completion rates
 */
const getCompletionMetrics = async (filters = {}) => {
  const dateFilter = buildDateFilter(filters.startDate, filters.endDate);
  const match = { ...dateFilter };

  if (filters.department) {
    match.department = filters.department;
  }

  const pipeline = [
    { $match: match },
    {
      $facet: {
        total: [{ $count: 'value' }],
        completed: [
          { $match: { workflowStage: WORKFLOW_STAGES.COMPLETED } },
          { $count: 'value' },
        ],
        active: [
          { $match: { workflowStage: WORKFLOW_STAGES.ACTIVE } },
          { $count: 'value' },
        ],
        terminated: [
          { $match: { status: 'TERMINATED' } },
          { $count: 'value' },
        ],
        certificateIssued: [
          { $match: { workflowStage: WORKFLOW_STAGES.CERTIFICATE_ISSUED } },
          { $count: 'value' },
        ],
      },
    },
  ];

  const [result] = await Referral.aggregate(pipeline).allowDiskUse(true);

  const total = (result.total && result.total[0] && result.total[0].value) || 0;
  const completed = (result.completed && result.completed[0] && result.completed[0].value) || 0;
  const active = (result.active && result.active[0] && result.active[0].value) || 0;
  const terminated = (result.terminated && result.terminated[0] && result.terminated[0].value) || 0;
  const certificateIssued = (result.certificateIssued && result.certificateIssued[0] && result.certificateIssued[0].value) || 0;

  return {
    total,
    completed,
    active,
    terminated,
    certificateIssued,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    certificateRate: completed > 0 ? Math.round((certificateIssued / completed) * 100) : 0,
  };
};

/**
 * Get mentor analytics
 */
const getMentorAnalytics = async (filters = {}) => {
  const dateFilter = buildDateFilter(filters.startDate, filters.endDate);
  const match = { ...dateFilter, mentor: { $exists: true, $ne: null } };

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$mentor',
        totalReferrals: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ['$workflowStage', WORKFLOW_STAGES.COMPLETED] }, 1, 0],
          },
        },
        active: {
          $sum: {
            $cond: [{ $eq: ['$workflowStage', WORKFLOW_STAGES.ACTIVE] }, 1, 0],
          },
        },
        slaBreaches: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $lt: ['$slaDeadline', new Date()] },
                  { $nin: ['$workflowStage', [WORKFLOW_STAGES.COMPLETED, WORKFLOW_STAGES.CLOSED]] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'mentorInfo',
      },
    },
    { $unwind: '$mentorInfo' },
    {
      $project: {
        mentorId: '$_id',
        mentorName: '$mentorInfo.name',
        mentorEmail: '$mentorInfo.email',
        totalReferrals: 1,
        completed: 1,
        active: 1,
        slaBreaches: 1,
        completionRate: {
          $cond: [
            { $gt: ['$totalReferrals', 0] },
            { $round: [{ $multiply: [{ $divide: ['$completed', '$totalReferrals'] }, 100] }, 2] },
            0,
          ],
        },
        _id: 0,
      },
    },
    { $sort: { totalReferrals: -1 } },
  ];

  return Referral.aggregate(pipeline).allowDiskUse(true);
};

/**
 * Get access provisioning metrics
 */
const getAccessProvisioningMetrics = async (filters = {}) => {
  const dateFilter = buildDateFilter(filters.startDate, filters.endDate);
  const match = { ...dateFilter };

  const pipeline = [
    { $match: match },
    {
      $facet: {
        total: [{ $count: 'value' }],
        pending: [
          { $match: { status: 'PENDING' } },
          { $count: 'value' },
        ],
        completed: [
          { $match: { status: 'COMPLETED' } },
          { $count: 'value' },
        ],
        delayed: [
          {
            $match: {
              status: { $ne: 'COMPLETED' },
              createdAt: { $lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
            },
          },
          { $count: 'value' },
        ],
      },
    },
  ];

  const [result] = await AccessProvision.aggregate(pipeline).allowDiskUse(true);

  const total = (result.total && result.total[0] && result.total[0].value) || 0;
  const pending = (result.pending && result.pending[0] && result.pending[0].value) || 0;
  const completed = (result.completed && result.completed[0] && result.completed[0].value) || 0;
  const delayed = (result.delayed && result.delayed[0] && result.delayed[0].value) || 0;

  return {
    total,
    pending,
    completed,
    delayed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    delayRate: total > 0 ? Math.round((delayed / total) * 100) : 0,
  };
};

/**
 * Get timeline trends - referrals/completions over time
 */
const getTimelineTrends = async (filters = {}, granularity = 'month') => {
  const dateFilter = buildDateFilter(filters.startDate, filters.endDate);
  const match = { ...dateFilter };

  const groupStage = {
    month: {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        referrals: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ['$workflowStage', WORKFLOW_STAGES.COMPLETED] }, 1, 0],
          },
        },
      },
    },
    week: {
      $group: {
        _id: {
          year: { $isoWeekYear: '$createdAt' },
          week: { $isoWeek: '$createdAt' },
        },
        referrals: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ['$workflowStage', WORKFLOW_STAGES.COMPLETED] }, 1, 0],
          },
        },
      },
    },
    day: {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        referrals: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ['$workflowStage', WORKFLOW_STAGES.COMPLETED] }, 1, 0],
          },
        },
      },
    },
  };

  const pipeline = [
    { $match: match },
    groupStage[granularity],
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 } },
  ];

  return Referral.aggregate(pipeline).allowDiskUse(true);
};

/**
 * Get referrer performance
 */
const getReferrerAnalytics = async (filters = {}) => {
  const dateFilter = buildDateFilter(filters.startDate, filters.endDate);
  const match = { ...dateFilter, referrer: { $exists: true, $ne: null } };

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$referrer',
        totalReferrals: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ['$workflowStage', WORKFLOW_STAGES.COMPLETED] }, 1, 0],
          },
        },
        active: {
          $sum: {
            $cond: [{ $eq: ['$workflowStage', WORKFLOW_STAGES.ACTIVE] }, 1, 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'referrerInfo',
      },
    },
    { $unwind: '$referrerInfo' },
    {
      $project: {
        referrerId: '$_id',
        referrerName: '$referrerInfo.name',
        referrerEmail: '$referrerInfo.email',
        totalReferrals: 1,
        completed: 1,
        active: 1,
        completionRate: {
          $cond: [
            { $gt: ['$totalReferrals', 0] },
            { $round: [{ $multiply: [{ $divide: ['$completed', '$totalReferrals'] }, 100] }, 2] },
            0,
          ],
        },
        _id: 0,
      },
    },
    { $sort: { totalReferrals: -1 } },
  ];

  return Referral.aggregate(pipeline).allowDiskUse(true);
};

/**
 * Get detailed report data for export
 */
const getDetailedReport = async (filters = {}) => {
  const match = {};

  if (filters.startDate || filters.endDate) {
    match.createdAt = buildDateFilter(filters.startDate, filters.endDate).createdAt;
  }

  if (filters.status) {
    match.status = filters.status;
  }

  if (filters.workflowStage) {
    match.workflowStage = filters.workflowStage;
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'users',
        localField: 'mentor',
        foreignField: '_id',
        as: 'mentorInfo',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'referrer',
        foreignField: '_id',
        as: 'referrerInfo',
      },
    },
    {
      $project: {
        _id: 1,
        candidateName: 1,
        candidateEmail: 1,
        candidatePhone: 1,
        status: 1,
        workflowStage: 1,
        mentorName: { $arrayElemAt: ['$mentorInfo.name', 0] },
        referrerName: { $arrayElemAt: ['$referrerInfo.name', 0] },
        slaDeadline: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    { $sort: { createdAt: -1 } },
  ];

  return Referral.aggregate(pipeline).allowDiskUse(true);
};

module.exports = {
  getOverviewMetrics,
  getOnboardingFunnel,
  getReferralConversion,
  getSLAMetrics,
  getWorkflowBottlenecks,
  getCompletionMetrics,
  getMentorAnalytics,
  getAccessProvisioningMetrics,
  getTimelineTrends,
  getReferrerAnalytics,
  getDetailedReport,
};
