const emailService = require('../services/emailService');
const logger = require('../utils/logger');

const QUEUE_INTERVAL_MS = parseInt(process.env.EMAIL_QUEUE_INTERVAL_MS, 10) || 30000;
const QUEUE_BATCH_SIZE = parseInt(process.env.EMAIL_QUEUE_BATCH_SIZE, 10) || 20;

let isProcessing = false;

const processEmailQueue = async () => {
  if (isProcessing) {
    logger.info('[EmailQueue] Skipping — previous run still in progress');
    return;
  }

  isProcessing = true;
  const start = Date.now();

  try {
    const results = await emailService.processQueue(QUEUE_BATCH_SIZE);

    if (results.length > 0) {
      const sent = results.filter((r) => r.ok).length;
      const failed = results.filter((r) => !r.ok).length;
      logger.info(`[EmailQueue] Processed ${results.length} email(s) in ${Date.now() - start}ms — sent: ${sent}, failed: ${failed}`);
    }
  } catch (err) {
    logger.error(`[EmailQueue] Queue processing error: ${err.message || err}`);
  } finally {
    isProcessing = false;
  }
};

const startEmailQueueWorker = () => {
  logger.info(`[EmailQueue] Worker started (interval: ${QUEUE_INTERVAL_MS}ms, batchSize: ${QUEUE_BATCH_SIZE})`);
  // drain queue immediately on startup
  processEmailQueue();
  return setInterval(processEmailQueue, QUEUE_INTERVAL_MS);
};

module.exports = { startEmailQueueWorker, processEmailQueue };
