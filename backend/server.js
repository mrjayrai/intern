require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');
const { startSlaAlertScheduler } = require('./src/jobs/slaCron');
const { startEmailQueueWorker } = require('./src/jobs/emailQueueCron');

const PORT = process.env.PORT || 5000;
const SLA_ALERT_CHECK_INTERVAL_MINUTES = process.env.SLA_ALERT_CHECK_INTERVAL_MINUTES || 60;

connectDB()
  .then(() => {
    const server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info(`Intern Flow backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      startSlaAlertScheduler(SLA_ALERT_CHECK_INTERVAL_MINUTES);
      startEmailQueueWorker();
    });

    server.on('error', (error) => {
      logger.error(`Server error: ${error.message}`);
      process.exit(1);
    });
  })
  .catch((error) => {
    logger.error(`Startup failed: ${error.message}`);
    process.exit(1);
  });
