const dashboardService = require('../services/dashboardService');
const ApiError = require('../utils/apiError');

exports.getOverview = async (req, res, next) => {
  try {
    const { metrics, monthlyTrends, funnel } = await dashboardService.getDashboardMetrics();
    const activity = await dashboardService.getActivityFeed(25);

    return res.status(200).json({ success: true, data: { metrics, funnel, monthlyTrends, activity } });
  } catch (err) {
    return next(new ApiError(500, 'Failed to load dashboard overview'));
  }
};

exports.getActivity = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const activity = await dashboardService.getActivityFeed(limit);
    return res.status(200).json({ success: true, data: activity });
  } catch (err) {
    return next(new ApiError(500, 'Failed to load activity feed'));
  }
};

exports.getFunnel = async (req, res, next) => {
  try {
    const funnel = await dashboardService.getWorkflowFunnel();
    return res.status(200).json({ success: true, data: funnel });
  } catch (err) {
    return next(new ApiError(500, 'Failed to load funnel counts'));
  }
};

exports.getMonthlyTrends = async (req, res, next) => {
  try {
    const months = Math.min(Math.max(parseInt(req.query.months, 10) || 12, 1), 36);
    const trends = await dashboardService.getMonthlyReferralTrends(months);
    return res.status(200).json({ success: true, data: trends });
  } catch (err) {
    return next(new ApiError(500, 'Failed to load monthly trends'));
  }
};
const asyncHandler = require('../utils/asyncHandler');

exports.getDashboard = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { stats: {}, timeline: [] }, message: 'Dashboard placeholder' });
});
