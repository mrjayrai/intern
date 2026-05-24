/**
 * CSV Export Utility
 * Generate CSV files from report data
 */

/**
 * Escape CSV values - handle quotes, commas, and newlines
 */
const escapeCSVValue = (value) => {
  if (value === null || value === undefined) return '';

  let str = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
};

/**
 * Convert array of objects to CSV string
 */
const convertToCSV = (data, headers = null) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Determine headers
  let csvHeaders = headers;
  if (!csvHeaders) {
    csvHeaders = Object.keys(data[0]);
  }

  // Create header row
  const headerRow = csvHeaders.map((h) => escapeCSVValue(h)).join(',');

  // Create data rows
  const dataRows = data.map((item) => {
    return csvHeaders
      .map((header) => {
        const value = item[header];
        return escapeCSVValue(value);
      })
      .join(',');
  });

  return [headerRow, ...dataRows].join('\n');
};

/**
 * Generate CSV for overview metrics
 */
const generateOverviewMetricsCSV = (metrics, filters = {}) => {
  const data = [
    { metric: 'Total Referrals', value: metrics.totalReferrals || 0 },
    { metric: 'Active Internships', value: metrics.activeInternships || 0 },
    { metric: 'Completed Internships', value: metrics.completedInternships || 0 },
    { metric: 'SLA Breaches', value: metrics.slaBreaches || 0 },
  ];

  const headers = ['Metric', 'Value'];
  return convertToCSV(data, headers);
};

/**
 * Generate CSV for onboarding funnel
 */
const generateOnboardingFunnelCSV = (funnel, filters = {}) => {
  const headers = ['Stage', 'Count', 'Percentage'];

  return convertToCSV(funnel, headers);
};

/**
 * Generate CSV for referral conversion
 */
const generateReferralConversionCSV = (conversion, filters = {}) => {
  const data = [
    { metric: 'Total Referrals', value: conversion.total || 0 },
    { metric: 'Converted', value: conversion.converted || 0 },
    { metric: 'Rejection Rate (%)', value: conversion.rejectionRate || 0 },
    { metric: 'Pending', value: conversion.pending || 0 },
    { metric: 'Conversion Rate (%)', value: conversion.conversionRate || 0 },
  ];

  const headers = ['Metric', 'Value'];
  return convertToCSV(data, headers);
};

/**
 * Generate CSV for SLA metrics
 */
const generateSLAMetricsCSV = (slaData, filters = {}) => {
  const data = [
    { metric: 'Total Items with SLA', value: slaData.total || 0 },
    { metric: 'On Time', value: slaData.onTime || 0 },
    { metric: 'Breached', value: slaData.breached || 0 },
    { metric: 'Completed', value: slaData.completed || 0 },
    { metric: 'Breach Rate (%)', value: slaData.breachRate || 0 },
    { metric: 'Compliance Rate (%)', value: slaData.complianceRate || 0 },
  ];

  const headers = ['Metric', 'Value'];
  return convertToCSV(data, headers);
};

/**
 * Generate CSV for workflow bottlenecks
 */
const generateWorkflowBottlenecksCSV = (bottlenecks, filters = {}) => {
  const headers = ['Workflow Stage', 'Count', 'Avg Days in Stage'];

  return convertToCSV(bottlenecks, headers);
};

/**
 * Generate CSV for completion metrics
 */
const generateCompletionMetricsCSV = (completion, filters = {}) => {
  const data = [
    { metric: 'Total', value: completion.total || 0 },
    { metric: 'Completed', value: completion.completed || 0 },
    { metric: 'Active', value: completion.active || 0 },
    { metric: 'Terminated', value: completion.terminated || 0 },
    { metric: 'Certificate Issued', value: completion.certificateIssued || 0 },
    { metric: 'Completion Rate (%)', value: completion.completionRate || 0 },
    { metric: 'Certificate Rate (%)', value: completion.certificateRate || 0 },
  ];

  const headers = ['Metric', 'Value'];
  return convertToCSV(data, headers);
};

/**
 * Generate CSV for mentor analytics
 */
const generateMentorAnalyticsCSV = (mentors, filters = {}) => {
  const headers = ['Mentor Name', 'Mentor Email', 'Total Referrals', 'Completed', 'Active', 'SLA Breaches', 'Completion Rate (%)'];

  const formatted = mentors.map((mentor) => ({
    'Mentor Name': mentor.mentorName || 'N/A',
    'Mentor Email': mentor.mentorEmail || 'N/A',
    'Total Referrals': mentor.totalReferrals || 0,
    Completed: mentor.completed || 0,
    Active: mentor.active || 0,
    'SLA Breaches': mentor.slaBreaches || 0,
    'Completion Rate (%)': mentor.completionRate || 0,
  }));

  return convertToCSV(formatted, headers);
};

/**
 * Generate CSV for referrer analytics
 */
const generateReferrerAnalyticsCSV = (referrers, filters = {}) => {
  const headers = ['Referrer Name', 'Referrer Email', 'Total Referrals', 'Completed', 'Active', 'Completion Rate (%)'];

  const formatted = referrers.map((referrer) => ({
    'Referrer Name': referrer.referrerName || 'N/A',
    'Referrer Email': referrer.referrerEmail || 'N/A',
    'Total Referrals': referrer.totalReferrals || 0,
    Completed: referrer.completed || 0,
    Active: referrer.active || 0,
    'Completion Rate (%)': referrer.completionRate || 0,
  }));

  return convertToCSV(formatted, headers);
};

/**
 * Generate CSV for access provisioning metrics
 */
const generateAccessProvisioningCSV = (provisioning, filters = {}) => {
  const data = [
    { metric: 'Total Requests', value: provisioning.total || 0 },
    { metric: 'Pending', value: provisioning.pending || 0 },
    { metric: 'Completed', value: provisioning.completed || 0 },
    { metric: 'Delayed', value: provisioning.delayed || 0 },
    { metric: 'Completion Rate (%)', value: provisioning.completionRate || 0 },
    { metric: 'Delay Rate (%)', value: provisioning.delayRate || 0 },
  ];

  const headers = ['Metric', 'Value'];
  return convertToCSV(data, headers);
};

/**
 * Generate CSV for detailed report
 */
const generateDetailedReportCSV = (records, filters = {}) => {
  const headers = [
    'Candidate Name',
    'Candidate Email',
    'Candidate Phone',
    'Status',
    'Workflow Stage',
    'Mentor Name',
    'Referrer Name',
    'SLA Deadline',
    'Created Date',
    'Updated Date',
  ];

  const formatted = records.map((record) => ({
    'Candidate Name': record.candidateName || 'N/A',
    'Candidate Email': record.candidateEmail || 'N/A',
    'Candidate Phone': record.candidatePhone || 'N/A',
    Status: record.status || 'N/A',
    'Workflow Stage': record.workflowStage || 'N/A',
    'Mentor Name': record.mentorName || 'N/A',
    'Referrer Name': record.referrerName || 'N/A',
    'SLA Deadline': record.slaDeadline ? new Date(record.slaDeadline).toLocaleDateString() : 'N/A',
    'Created Date': record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A',
    'Updated Date': record.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : 'N/A',
  }));

  return convertToCSV(formatted, headers);
};

/**
 * Generate CSV for timeline trends
 */
const generateTimelineTrendsCSV = (trends, filters = {}) => {
  const headers = ['Period', 'Referrals', 'Completed'];

  const formatted = trends.map((trend) => {
    const period = `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`;
    return {
      Period: period,
      Referrals: trend.referrals || 0,
      Completed: trend.completed || 0,
    };
  });

  return convertToCSV(formatted, headers);
};

/**
 * Create CSV file with metadata
 */
const createCSVFile = (csvContent, filename) => {
  const timestamp = new Date().toISOString();
  const header = `Report Generated: ${timestamp}\n\n`;

  return {
    filename,
    content: header + csvContent,
    mimeType: 'text/csv',
    encoding: 'utf-8',
  };
};

module.exports = {
  escapeCSVValue,
  convertToCSV,
  generateOverviewMetricsCSV,
  generateOnboardingFunnelCSV,
  generateReferralConversionCSV,
  generateSLAMetricsCSV,
  generateWorkflowBottlenecksCSV,
  generateCompletionMetricsCSV,
  generateMentorAnalyticsCSV,
  generateReferrerAnalyticsCSV,
  generateAccessProvisioningCSV,
  generateDetailedReportCSV,
  generateTimelineTrendsCSV,
  createCSVFile,
};
