require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const config = require('./src/config/environment');
const logger = require('./src/utils/logger');
const { startSlaAlertScheduler } = require('./src/jobs/slaCron');
const { startEmailQueueWorker } = require('./src/jobs/emailQueueCron');

const PORT = config.port;
const SLA_ALERT_CHECK_INTERVAL_MINUTES = process.env.SLA_ALERT_CHECK_INTERVAL_MINUTES || 60;

// Validate configuration
try {
  config.validate();
} catch (error) {
  logger.error(`Configuration validation failed: ${error.message}`);
  process.exit(1);
}

connectDB()
  .then(() => {
    const server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info(`🚀 Intern Flow backend started successfully!`);
      logger.info(`Server running on: ${config.backendUrl}`);

      // Print configuration for debugging
      config.printConfig();

      // Start background jobs
      startSlaAlertScheduler(SLA_ALERT_CHECK_INTERVAL_MINUTES);
      startEmailQueueWorker();

      // Local development tips
      if (config.isDevelopment()) {
        console.log('\n💡 Local Development Tips:');
        console.log('=====================================');
        console.log('📧 Activation links will appear in console logs');
        console.log('🌐 Frontend: ' + config.frontendUrl);
        console.log('🔌 API Docs: ' + config.backendUrl + '/health');
        console.log('=====================================\n');
      }
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
