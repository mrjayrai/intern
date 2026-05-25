const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const referralRoutes = require('./routes/referralRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const ndaRoutes = require('./routes/ndaRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const emailRoutes = require('./routes/emailRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const onboardingInviteRoutes = require('./routes/onboardingInviteRoutes');
const nonWorkerIdRoutes = require('./routes/nonWorkerIdRoutes');
const accessProvisionRoutes = require('./routes/accessProvisionRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const errorHandler = require('./middleware/errorMiddleware');
const constants = require('./config/constants');
const config = require('./config/environment');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: constants.APP_NAME,
    version: constants.APP_VERSION,
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/nda', ndaRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/onboarding-invites', onboardingInviteRoutes);
app.use('/api/ids', nonWorkerIdRoutes);
app.use('/api/access', accessProvisionRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/reports', reportsRoutes);

app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

app.use(errorHandler);

module.exports = app;
