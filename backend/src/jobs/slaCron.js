const notificationService = require('../services/notificationService');
const ndaService = require('../services/ndaService');
const nonWorkerIdService = require('../services/nonWorkerIdService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

const SLA_WARNING_HOURS = parseInt(process.env.SLA_WARNING_HOURS, 10) || 24;

const sendSlaWarningEmails = async () => {
  const now = new Date();
  const warningThreshold = new Date(now.getTime() + SLA_WARNING_HOURS * 60 * 60 * 1000);

  try {
    // Non-Worker ID SLA warnings (have candidateEmail on the record)
    const idBreaches = await nonWorkerIdService.findSlaBreaches();
    for (const rec of idBreaches) {
      if (!rec.candidateEmail) continue;
      const hoursRemaining = rec.slaDeadline
        ? Math.max(0, Math.round((new Date(rec.slaDeadline) - now) / (1000 * 60 * 60)))
        : null;
      await emailService.enqueueEmail(rec.candidateEmail, 'slaWarning', {
        name: rec.candidateName || 'Team',
        referralId: rec.referralId ? rec.referralId.toString() : '',
        stage: 'NON_WORKER_ID_PENDING',
        deadline: rec.slaDeadline ? new Date(rec.slaDeadline).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '',
        hoursRemaining,
        candidateName: rec.candidateName || '',
      });
    }
    if (idBreaches.length > 0) {
      logger.info(`[SLACron] Sent ${idBreaches.length} SLA warning email(s) for Non-Worker ID requests`);
    }
  } catch (err) {
    logger.error(`[SLACron] Failed to send Non-Worker ID SLA warning emails: ${err.message || err}`);
  }
};

const startSlaAlertScheduler = (intervalMinutes = 60) => {
  const intervalMs = Math.max(parseInt(intervalMinutes, 10) || 60, 1) * 60 * 1000;

  const runCheck = async () => {
    try {
      await ndaService.expireOverdueNdas();
      await notificationService.createSlaAlertNotifications();
      await sendSlaWarningEmails();
    } catch (error) {
      logger.error(`SLA alert scheduler failed: ${error?.message || error}`);
    }
  };

  runCheck();
  return setInterval(runCheck, intervalMs);
};

module.exports = {
  startSlaAlertScheduler,
};
