const dashboardService = require('../services/dashboardService');
const ApiError = require('../utils/apiError');

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatFunnel = (funnel = {}) => (
  Object.entries(funnel).map(([stage, count]) => ({
    stage,
    count,
  }))
);

const formatMonthlyTrends = (monthlyTrends = []) => (
  monthlyTrends.map((item) => ({
    month: `${monthNames[(item.month || 1) - 1]} ${item.year}`,
    referrals: item.count,
    interns: item.count,
  }))
);

const formatActivity = (activity = []) => (
  activity.map((item) => ({
    id: item._id,
    message: `${item.action} ${item.resourceType}`,
    time: item.createdAt,
    performedBy: item.performedBy,
    resourceType: item.resourceType,
  }))
);

const buildSlaAlerts = (metrics = {}) => {
  const alerts = [];

  if (metrics.slaBreaches > 0) {
    alerts.push({
      id: 'sla-breaches',
      severity: 'error',
      message: `${metrics.slaBreaches} workflow item${metrics.slaBreaches === 1 ? '' : 's'} past SLA deadline`,
      action: 'Review',
    });
  }

  if (metrics.ndaPending > 0) {
    alerts.push({
      id: 'nda-pending',
      severity: 'warning',
      message: `${metrics.ndaPending} NDA${metrics.ndaPending === 1 ? '' : 's'} pending`,
      action: 'Open documents',
    });
  }

  if (metrics.onboardingPending > 0) {
    alerts.push({
      id: 'onboarding-pending',
      severity: 'warning',
      message: `${metrics.onboardingPending} onboarding workflow${metrics.onboardingPending === 1 ? '' : 's'} pending`,
      action: 'View onboarding',
    });
  }

  return alerts;
};

exports.getDashboard = async (req, res, next) => {
  try {
    const { metrics, monthlyTrends, funnel } = await dashboardService.getDashboardMetrics();
    const activity = await dashboardService.getActivityFeed(25);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalReferrals: metrics.totalReferrals,
          totalInterns: metrics.totalReferrals,
          pendingOnboarding: metrics.onboardingPending,
          ndaPending: metrics.ndaPending,
          slaBreaches: metrics.slaBreaches,
          activeInternships: metrics.activeInternships,
          certificatesIssued: metrics.certificatesIssued,
          certificatesPending: funnel.CERTIFICATE_PENDING || 0,
        },
        funnelData: formatFunnel(funnel),
        trendData: formatMonthlyTrends(monthlyTrends),
        timeline: formatActivity(activity),
        slaAlerts: buildSlaAlerts(metrics),
      },
    });
  } catch (err) {
    return next(new ApiError(500, 'Failed to load dashboard overview'));
  }
};

exports.getActivity = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const activity = await dashboardService.getActivityFeed(limit);
    return res.status(200).json({ success: true, data: formatActivity(activity) });
  } catch (err) {
    return next(new ApiError(500, 'Failed to load activity feed'));
  }
};

exports.getFunnel = async (req, res, next) => {
  try {
    const funnel = await dashboardService.getWorkflowFunnel();
    return res.status(200).json({ success: true, data: formatFunnel(funnel) });
  } catch (err) {
    return next(new ApiError(500, 'Failed to load funnel counts'));
  }
};

exports.getMonthlyTrends = async (req, res, next) => {
  try {
    const months = Math.min(Math.max(parseInt(req.query.months, 10) || 12, 1), 36);
    const trends = await dashboardService.getMonthlyReferralTrends(months);
    return res.status(200).json({ success: true, data: formatMonthlyTrends(trends) });
  } catch (err) {
    return next(new ApiError(500, 'Failed to load monthly trends'));
  }
};
