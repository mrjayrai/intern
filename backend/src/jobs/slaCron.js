const notificationService = require('../services/notificationService');
const ndaService = require('../services/ndaService');
const logger = require('../utils/logger');

const startSlaAlertScheduler = (intervalMinutes = 60) => {
  const intervalMs = Math.max(parseInt(intervalMinutes, 10) || 60, 1) * 60 * 1000;

  const runCheck = async () => {
    try {
      await ndaService.expireOverdueNdas();
      await notificationService.createSlaAlertNotifications();
      if (typeof notificationService.createSlaAlertNotifications.extendWithOtherWorkflows === 'function') {
        await notificationService.createSlaAlertNotifications.extendWithOtherWorkflows();
      }
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
