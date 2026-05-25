const reportingService = require('../services/reportingService');
const auditService = require('../services/auditService');
const reportValidator = require('../validators/reportValidator');
const csvExportUtils = require('../utils/csvExportUtils');
const pdfExportUtils = require('../utils/pdfExportUtils');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');

/**
 * Check if user has permission to access reports
 */
const checkReportPermission = (userRole) => {
  const allowedRoles = [ROLES.SUPER_ADMIN, ROLES.HR, ROLES.MENTOR];
  if (!allowedRoles.includes(userRole)) {
    throw new ApiError(403, 'You do not have permission to access reports');
  }
};

/**
 * Log report access for audit
 */
const logReportAccess = async (userId, reportType, filters) => {
  try {
    console.log(`[Reports] Logging audit for report type: ${reportType}`);
    await auditService.createAuditLog({
      action: 'VIEW_REPORT',
      resourceType: 'Report',
      resourceKey: reportType, // Use resourceKey for string identifiers
      performedById: userId,
      details: { filters, timestamp: new Date() },
    });
    console.log(`[Reports] Audit log created for report: ${reportType}`);
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('[Reports] Audit logging failed:', error);
  }
};

/**
 * GET /api/reports/overview
 * Get overview metrics
 */
const getOverviewReport = asyncHandler(async (req, res) => {
  checkReportPermission(req.user.role);

  const filters = reportValidator.sanitizeFilters(req.query);
  const validationErrors = reportValidator.validateReportFilters(filters);

  if (validationErrors.length > 0) {
    throw new ApiError(400, validationErrors.join(', '));
  }

  const metrics = await reportingService.getOverviewMetrics(filters);

  await logReportAccess(req.user._id, 'overview', filters);

  res.status(200).json({
    success: true,
    data: {
      reportType: 'overview',
      metrics,
      filters,
      generatedAt: new Date(),
    },
  });
});

/**
 * GET /api/reports/onboarding
 * Get onboarding funnel report
 */
const getOnboardingReport = asyncHandler(async (req, res) => {
  checkReportPermission(req.user.role);

  const filters = reportValidator.sanitizeFilters(req.query);
  const validationErrors = reportValidator.validateReportFilters(filters);

  if (validationErrors.length > 0) {
    throw new ApiError(400, validationErrors.join(', '));
  }

  const funnel = await reportingService.getOnboardingFunnel(filters);

  await logReportAccess(req.user._id, 'onboarding', filters);

  res.status(200).json({
    success: true,
    data: {
      reportType: 'onboarding',
      funnel,
      filters,
      generatedAt: new Date(),
    },
  });
});

/**
 * GET /api/reports/referrals
 * Get referral conversion report
 */
const getReferralConversionReport = asyncHandler(async (req, res) => {
  checkReportPermission(req.user.role);

  const filters = reportValidator.sanitizeFilters(req.query);
  const validationErrors = reportValidator.validateReportFilters(filters);

  if (validationErrors.length > 0) {
    throw new ApiError(400, validationErrors.join(', '));
  }

  const conversionMetrics = await reportingService.getReferralConversion(filters);

  await logReportAccess(req.user._id, 'referrals', filters);

  res.status(200).json({
    success: true,
    data: {
      reportType: 'referrals',
      conversion: conversionMetrics,
      filters,
      generatedAt: new Date(),
    },
  });
});

/**
 * GET /api/reports/sla
 * Get SLA metrics report
 */
const getSLAReport = asyncHandler(async (req, res) => {
  checkReportPermission(req.user.role);

  const filters = reportValidator.sanitizeFilters(req.query);
  const validationErrors = reportValidator.validateReportFilters(filters);

  if (validationErrors.length > 0) {
    throw new ApiError(400, validationErrors.join(', '));
  }

  const slaMetrics = await reportingService.getSLAMetrics(filters);

  await logReportAccess(req.user._id, 'sla', filters);

  res.status(200).json({
    success: true,
    data: {
      reportType: 'sla',
      metrics: slaMetrics,
      filters,
      generatedAt: new Date(),
    },
  });
});

/**
 * GET /api/reports/workflows
 * Get workflow bottlenecks report
 */
const getWorkflowReport = asyncHandler(async (req, res) => {
  checkReportPermission(req.user.role);

  const filters = reportValidator.sanitizeFilters(req.query);
  const validationErrors = reportValidator.validateReportFilters(filters);

  if (validationErrors.length > 0) {
    throw new ApiError(400, validationErrors.join(', '));
  }

  const bottlenecks = await reportingService.getWorkflowBottlenecks(filters);
  const completionMetrics = await reportingService.getCompletionMetrics(filters);

  await logReportAccess(req.user._id, 'workflows', filters);

  res.status(200).json({
    success: true,
    data: {
      reportType: 'workflows',
      bottlenecks,
      completion: completionMetrics,
      filters,
      generatedAt: new Date(),
    },
  });
});

/**
 * GET /api/reports/mentors
 * Get mentor analytics report
 */
const getMentorReport = asyncHandler(async (req, res) => {
  checkReportPermission(req.user.role);

  const filters = reportValidator.sanitizeFilters(req.query);
  const validationErrors = reportValidator.validateReportFilters(filters);

  if (validationErrors.length > 0) {
    throw new ApiError(400, validationErrors.join(', '));
  }

  const mentorAnalytics = await reportingService.getMentorAnalytics(filters);

  await logReportAccess(req.user._id, 'mentors', filters);

  res.status(200).json({
    success: true,
    data: {
      reportType: 'mentors',
      mentors: mentorAnalytics,
      filters,
      generatedAt: new Date(),
    },
  });
});

/**
 * GET /api/reports/referrers
 * Get referrer analytics report
 */
const getReferrerReport = asyncHandler(async (req, res) => {
  checkReportPermission(req.user.role);

  const filters = reportValidator.sanitizeFilters(req.query);
  const validationErrors = reportValidator.validateReportFilters(filters);

  if (validationErrors.length > 0) {
    throw new ApiError(400, validationErrors.join(', '));
  }

  const referrerAnalytics = await reportingService.getReferrerAnalytics(filters);

  await logReportAccess(req.user._id, 'referrers', filters);

  res.status(200).json({
    success: true,
    data: {
      reportType: 'referrers',
      referrers: referrerAnalytics,
      filters,
      generatedAt: new Date(),
    },
  });
});

/**
 * GET /api/reports/provisioning
 * Get access provisioning metrics report
 */
const getProvisioningReport = asyncHandler(async (req, res) => {
  checkReportPermission(req.user.role);

  const filters = reportValidator.sanitizeFilters(req.query);
  const validationErrors = reportValidator.validateReportFilters(filters);

  if (validationErrors.length > 0) {
    throw new ApiError(400, validationErrors.join(', '));
  }

  const provisioningMetrics = await reportingService.getAccessProvisioningMetrics(filters);

  await logReportAccess(req.user._id, 'provisioning', filters);

  res.status(200).json({
    success: true,
    data: {
      reportType: 'provisioning',
      metrics: provisioningMetrics,
      filters,
      generatedAt: new Date(),
    },
  });
});

/**
 * GET /api/reports/timeline
 * Get timeline trends report
 */
const getTimelineReport = asyncHandler(async (req, res) => {
  checkReportPermission(req.user.role);

  const filters = reportValidator.sanitizeFilters(req.query);
  const validationErrors = reportValidator.validateReportFilters(filters);

  if (validationErrors.length > 0) {
    throw new ApiError(400, validationErrors.join(', '));
  }

  const granularity = filters.granularity || 'month';
  const trends = await reportingService.getTimelineTrends(filters, granularity);

  await logReportAccess(req.user._id, 'timeline', filters);

  res.status(200).json({
    success: true,
    data: {
      reportType: 'timeline',
      trends,
      granularity,
      filters,
      generatedAt: new Date(),
    },
  });
});

/**
 * GET /api/reports/export/csv
 * Export reports as CSV
 */
const exportCSV = asyncHandler(async (req, res) => {
  checkReportPermission(req.user.role);

  const { reportType = 'overview' } = req.query;
  const filters = reportValidator.sanitizeFilters(req.query);

  const exportErrors = reportValidator.validateExportRequest({ ...filters, reportType, format: 'csv' });
  if (exportErrors.length > 0) {
    throw new ApiError(400, exportErrors.join(', '));
  }

  let csvContent;
  let filename;

  try {
    switch (reportType.toLowerCase()) {
      case 'overview': {
        const metrics = await reportingService.getOverviewMetrics(filters);
        csvContent = csvExportUtils.generateOverviewMetricsCSV(metrics, filters);
        filename = 'overview-metrics.csv';
        break;
      }

      case 'onboarding': {
        const funnel = await reportingService.getOnboardingFunnel(filters);
        csvContent = csvExportUtils.generateOnboardingFunnelCSV(funnel, filters);
        filename = 'onboarding-funnel.csv';
        break;
      }

      case 'referrals': {
        const conversion = await reportingService.getReferralConversion(filters);
        csvContent = csvExportUtils.generateReferralConversionCSV(conversion, filters);
        filename = 'referral-conversion.csv';
        break;
      }

      case 'sla': {
        const slaMetrics = await reportingService.getSLAMetrics(filters);
        csvContent = csvExportUtils.generateSLAMetricsCSV(slaMetrics, filters);
        filename = 'sla-metrics.csv';
        break;
      }

      case 'workflows': {
        const bottlenecks = await reportingService.getWorkflowBottlenecks(filters);
        csvContent = csvExportUtils.generateWorkflowBottlenecksCSV(bottlenecks, filters);
        filename = 'workflow-bottlenecks.csv';
        break;
      }

      case 'completion': {
        const completion = await reportingService.getCompletionMetrics(filters);
        csvContent = csvExportUtils.generateCompletionMetricsCSV(completion, filters);
        filename = 'completion-metrics.csv';
        break;
      }

      case 'mentors': {
        const mentors = await reportingService.getMentorAnalytics(filters);
        csvContent = csvExportUtils.generateMentorAnalyticsCSV(mentors, filters);
        filename = 'mentor-analytics.csv';
        break;
      }

      case 'referrers': {
        const referrers = await reportingService.getReferrerAnalytics(filters);
        csvContent = csvExportUtils.generateReferrerAnalyticsCSV(referrers, filters);
        filename = 'referrer-analytics.csv';
        break;
      }

      case 'provisioning': {
        const provisioning = await reportingService.getAccessProvisioningMetrics(filters);
        csvContent = csvExportUtils.generateAccessProvisioningCSV(provisioning, filters);
        filename = 'access-provisioning.csv';
        break;
      }

      case 'detailed': {
        const records = await reportingService.getDetailedReport(filters);
        csvContent = csvExportUtils.generateDetailedReportCSV(records, filters);
        filename = 'detailed-report.csv';
        break;
      }

      default:
        throw new ApiError(400, `Unknown report type: ${reportType}`);
    }

    await logReportAccess(req.user._id, `export-csv-${reportType}`, filters);

    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${timestamp}-${filename}"`);
    res.send(csvContent);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to generate CSV report: ${error.message}`);
  }
});

/**
 * GET /api/reports/export/pdf
 * Export reports as PDF
 */
const exportPDF = asyncHandler(async (req, res) => {
  checkReportPermission(req.user.role);

  const { reportType = 'overview' } = req.query;
  const filters = reportValidator.sanitizeFilters(req.query);

  const exportErrors = reportValidator.validateExportRequest({ ...filters, reportType, format: 'pdf' });
  if (exportErrors.length > 0) {
    throw new ApiError(400, exportErrors.join(', '));
  }

  let doc;
  let filename;

  try {
    switch (reportType.toLowerCase()) {
      case 'overview': {
        const metrics = await reportingService.getOverviewMetrics(filters);
        doc = pdfExportUtils.generateOverviewMetricsPDF(metrics, filters);
        filename = 'overview-metrics.pdf';
        break;
      }

      case 'onboarding': {
        const funnel = await reportingService.getOnboardingFunnel(filters);
        doc = pdfExportUtils.generateOnboardingFunnelPDF(funnel, filters);
        filename = 'onboarding-funnel.pdf';
        break;
      }

      case 'referrals': {
        const conversion = await reportingService.getReferralConversion(filters);
        doc = pdfExportUtils.generateReferralConversionPDF(conversion, filters);
        filename = 'referral-conversion.pdf';
        break;
      }

      case 'sla': {
        const slaMetrics = await reportingService.getSLAMetrics(filters);
        doc = pdfExportUtils.generateSLAMetricsPDF(slaMetrics, filters);
        filename = 'sla-metrics.pdf';
        break;
      }

      case 'workflows': {
        const bottlenecks = await reportingService.getWorkflowBottlenecks(filters);
        doc = pdfExportUtils.generateWorkflowBottlenecksPDF(bottlenecks, filters);
        filename = 'workflow-bottlenecks.pdf';
        break;
      }

      case 'completion': {
        const completion = await reportingService.getCompletionMetrics(filters);
        doc = pdfExportUtils.generateCompletionMetricsPDF(completion, filters);
        filename = 'completion-metrics.pdf';
        break;
      }

      case 'mentors': {
        const mentors = await reportingService.getMentorAnalytics(filters);
        doc = pdfExportUtils.generateMentorAnalyticsPDF(mentors, filters);
        filename = 'mentor-analytics.pdf';
        break;
      }

      case 'provisioning': {
        const provisioning = await reportingService.getAccessProvisioningMetrics(filters);
        doc = pdfExportUtils.generateAccessProvisioningPDF(provisioning, filters);
        filename = 'access-provisioning.pdf';
        break;
      }

      case 'detailed': {
        const records = await reportingService.getDetailedReport(filters);
        doc = pdfExportUtils.generateDetailedReportPDF(records, filters);
        filename = 'detailed-report.pdf';
        break;
      }

      default:
        throw new ApiError(400, `Unknown report type: ${reportType}`);
    }

    await logReportAccess(req.user._id, `export-pdf-${reportType}`, filters);

    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${timestamp}-${filename}"`);

    doc.pipe(res);
    doc.end();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to generate PDF report: ${error.message}`);
  }
});

module.exports = {
  getOverviewReport,
  getOnboardingReport,
  getReferralConversionReport,
  getSLAReport,
  getWorkflowReport,
  getMentorReport,
  getReferrerReport,
  getProvisioningReport,
  getTimelineReport,
  exportCSV,
  exportPDF,
};
