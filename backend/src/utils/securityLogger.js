/**
 * Security Event Logger
 *
 * Centralized security logging for:
 * - Unauthorized access attempts
 * - Invalid ownership access
 * - Invalid uploads
 * - Token failures
 * - Permission denials
 */

const chalk = require('chalk');

const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

/**
 * Format security log entry
 */
const formatSecurityLog = (level, event, details = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    event,
    ...details
  };

  return logEntry;
};

/**
 * Log unauthorized access attempt
 */
const logUnauthorizedAccess = (user, resource, action = 'access') => {
  const entry = formatSecurityLog(LOG_LEVELS.WARN, 'UNAUTHORIZED_ACCESS', {
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    resource,
    action,
    ip: user?.ip || 'unknown'
  });

  console.warn(chalk.yellow('[SECURITY ALERT]'), 'Unauthorized access attempt:', JSON.stringify(entry, null, 2));

  return entry;
};

/**
 * Log invalid ownership access
 */
const logInvalidOwnership = (user, resourceType, resourceId, ownerId) => {
  const entry = formatSecurityLog(LOG_LEVELS.WARN, 'INVALID_OWNERSHIP', {
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    resourceType,
    resourceId,
    expectedOwnerId: ownerId,
    ip: user?.ip || 'unknown'
  });

  console.warn(chalk.yellow('[SECURITY ALERT]'), 'Invalid ownership access:', JSON.stringify(entry, null, 2));

  return entry;
};

/**
 * Log invalid file upload
 */
const logInvalidUpload = (user, filename, category, errors) => {
  const entry = formatSecurityLog(LOG_LEVELS.WARN, 'INVALID_UPLOAD', {
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    filename,
    category,
    errors,
    ip: user?.ip || 'unknown'
  });

  console.warn(chalk.yellow('[SECURITY ALERT]'), 'Invalid file upload:', JSON.stringify(entry, null, 2));

  return entry;
};

/**
 * Log token failure
 */
const logTokenFailure = (token, reason, ip = 'unknown') => {
  const entry = formatSecurityLog(LOG_LEVELS.WARN, 'TOKEN_FAILURE', {
    tokenPrefix: token ? token.substring(0, 8) + '...' : 'missing',
    reason,
    ip
  });

  console.warn(chalk.yellow('[SECURITY ALERT]'), 'Token failure:', JSON.stringify(entry, null, 2));

  return entry;
};

/**
 * Log permission denial
 */
const logPermissionDenial = (user, permission, resource) => {
  const entry = formatSecurityLog(LOG_LEVELS.WARN, 'PERMISSION_DENIED', {
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    permission,
    resource,
    ip: user?.ip || 'unknown'
  });

  console.warn(chalk.yellow('[SECURITY ALERT]'), 'Permission denied:', JSON.stringify(entry, null, 2));

  return entry;
};

/**
 * Log authentication failure
 */
const logAuthFailure = (email, reason, ip = 'unknown') => {
  const entry = formatSecurityLog(LOG_LEVELS.WARN, 'AUTH_FAILURE', {
    email,
    reason,
    ip
  });

  console.warn(chalk.yellow('[SECURITY ALERT]'), 'Authentication failure:', JSON.stringify(entry, null, 2));

  return entry;
};

/**
 * Log suspicious activity
 */
const logSuspiciousActivity = (user, activity, details = {}) => {
  const entry = formatSecurityLog(LOG_LEVELS.ERROR, 'SUSPICIOUS_ACTIVITY', {
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    activity,
    ...details,
    ip: user?.ip || 'unknown'
  });

  console.error(chalk.red('[SECURITY CRITICAL]'), 'Suspicious activity detected:', JSON.stringify(entry, null, 2));

  return entry;
};

/**
 * Log successful security event (for audit trail)
 */
const logSecuritySuccess = (event, details = {}) => {
  const entry = formatSecurityLog(LOG_LEVELS.INFO, event, details);

  console.log(chalk.green('[SECURITY]'), event, JSON.stringify(details));

  return entry;
};

module.exports = {
  logUnauthorizedAccess,
  logInvalidOwnership,
  logInvalidUpload,
  logTokenFailure,
  logPermissionDenial,
  logAuthFailure,
  logSuspiciousActivity,
  logSecuritySuccess,
  LOG_LEVELS
};
