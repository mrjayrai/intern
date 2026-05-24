/**
 * Report Validators
 * Validate and sanitize report request filters
 */

const { WORKFLOW_STAGES } = require('../constants/workflowStages');

/**
 * Validate date range
 */
const validateDateRange = (startDate, endDate) => {
  const errors = [];

  if (startDate) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      errors.push('startDate must be a valid date');
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      errors.push('endDate must be a valid date');
    }
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      errors.push('startDate must be before endDate');
    }
  }

  return errors;
};

/**
 * Validate workflow stage
 */
const validateWorkflowStage = (stage) => {
  if (!stage) return [];

  const validStages = Object.values(WORKFLOW_STAGES);
  if (!validStages.includes(stage)) {
    return [`Invalid workflow stage: ${stage}`];
  }

  return [];
};

/**
 * Validate status
 */
const validateStatus = (status) => {
  if (!status) return [];

  const validStatuses = ['PENDING', 'ACTIVE', 'COMPLETED', 'REJECTED', 'TERMINATED', 'ON_HOLD'];
  if (!validStatuses.includes(status)) {
    return [`Invalid status: ${status}`];
  }

  return [];
};

/**
 * Validate limit (pagination)
 */
const validateLimit = (limit) => {
  if (!limit) return [];

  const limitNum = parseInt(limit, 10);
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
    return ['Limit must be between 1 and 1000'];
  }

  return [];
};

/**
 * Validate offset (pagination)
 */
const validateOffset = (offset) => {
  if (!offset) return [];

  const offsetNum = parseInt(offset, 10);
  if (isNaN(offsetNum) || offsetNum < 0) {
    return ['Offset must be a non-negative number'];
  }

  return [];
};

/**
 * Validate granularity for timeline
 */
const validateGranularity = (granularity) => {
  if (!granularity) return [];

  const validGranularities = ['day', 'week', 'month'];
  if (!validGranularities.includes(granularity.toLowerCase())) {
    return ['Granularity must be one of: day, week, month'];
  }

  return [];
};

/**
 * Validate report type
 */
const validateReportType = (type) => {
  if (!type) return [];

  const validTypes = ['overview', 'onboarding', 'referrals', 'sla', 'workflows', 'completion', 'mentors', 'referrers', 'provisioning'];
  if (!validTypes.includes(type.toLowerCase())) {
    return [`Invalid report type: ${type}`];
  }

  return [];
};

/**
 * Validate export format
 */
const validateExportFormat = (format) => {
  if (!format) return [];

  const validFormats = ['csv', 'pdf'];
  if (!validFormats.includes(format.toLowerCase())) {
    return ['Export format must be csv or pdf'];
  }

  return [];
};

/**
 * Validate report filters
 */
const validateReportFilters = (filters) => {
  const errors = [];

  if (filters.startDate || filters.endDate) {
    const dateErrors = validateDateRange(filters.startDate, filters.endDate);
    errors.push(...dateErrors);
  }

  if (filters.workflowStage) {
    const stageErrors = validateWorkflowStage(filters.workflowStage);
    errors.push(...stageErrors);
  }

  if (filters.status) {
    const statusErrors = validateStatus(filters.status);
    errors.push(...statusErrors);
  }

  if (filters.limit) {
    const limitErrors = validateLimit(filters.limit);
    errors.push(...limitErrors);
  }

  if (filters.offset) {
    const offsetErrors = validateOffset(filters.offset);
    errors.push(...offsetErrors);
  }

  if (filters.granularity) {
    const granularityErrors = validateGranularity(filters.granularity);
    errors.push(...granularityErrors);
  }

  return errors;
};

/**
 * Validate export request
 */
const validateExportRequest = (filters) => {
  const errors = [];

  if (filters.startDate || filters.endDate) {
    const dateErrors = validateDateRange(filters.startDate, filters.endDate);
    errors.push(...dateErrors);
  }

  if (filters.format) {
    const formatErrors = validateExportFormat(filters.format);
    errors.push(...formatErrors);
  }

  if (filters.reportType) {
    const typeErrors = validateReportType(filters.reportType);
    errors.push(...typeErrors);
  }

  if (filters.workflowStage) {
    const stageErrors = validateWorkflowStage(filters.workflowStage);
    errors.push(...stageErrors);
  }

  if (filters.status) {
    const statusErrors = validateStatus(filters.status);
    errors.push(...statusErrors);
  }

  return errors;
};

/**
 * Sanitize filter values
 */
const sanitizeFilters = (filters) => {
  const sanitized = {};

  if (filters.startDate) {
    sanitized.startDate = new Date(filters.startDate);
  }

  if (filters.endDate) {
    sanitized.endDate = new Date(filters.endDate);
  }

  if (filters.workflowStage) {
    sanitized.workflowStage = String(filters.workflowStage).trim();
  }

  if (filters.status) {
    sanitized.status = String(filters.status).trim().toUpperCase();
  }

  if (filters.department) {
    sanitized.department = String(filters.department).trim();
  }

  if (filters.mentor) {
    sanitized.mentor = String(filters.mentor).trim();
  }

  if (filters.limit) {
    sanitized.limit = Math.min(parseInt(filters.limit, 10), 1000);
  }

  if (filters.offset) {
    sanitized.offset = Math.max(parseInt(filters.offset, 10), 0);
  }

  if (filters.granularity) {
    sanitized.granularity = String(filters.granularity).trim().toLowerCase();
  }

  if (filters.format) {
    sanitized.format = String(filters.format).trim().toLowerCase();
  }

  if (filters.reportType) {
    sanitized.reportType = String(filters.reportType).trim().toLowerCase();
  }

  return sanitized;
};

module.exports = {
  validateDateRange,
  validateWorkflowStage,
  validateStatus,
  validateLimit,
  validateOffset,
  validateGranularity,
  validateReportType,
  validateExportFormat,
  validateReportFilters,
  validateExportRequest,
  sanitizeFilters,
};
