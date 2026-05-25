/**
 * Environment Configuration Helper
 * Detects environment and provides correct URLs for local and production
 */

const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,

  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/internflow',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // URLs - Smart defaults for local development
  frontendUrl: process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:5000',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Email
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  },
  email: {
    from: process.env.EMAIL_FROM || 'noreply@internflow.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Intern Flow',
  },

  // HR Contact
  hrContact: {
    email: process.env.HR_CONTACT_EMAIL || 'hr@internflow.com',
    phone: process.env.HR_CONTACT_PHONE || '+1 (555) 123-4567',
  },

  // AI Services
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  },

  // Storage
  storage: {
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    offerLettersDir: process.env.OFFER_LETTERS_DIR || './uploads/offer-letters',
    certificatesDir: process.env.CERTIFICATES_DIR || './uploads/certificates',
    resumesDir: process.env.RESUMES_DIR || './uploads/resumes',
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10'),
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },

  // Features
  features: {
    enableEmailQueue: process.env.ENABLE_EMAIL_QUEUE !== 'false',
    enableAiScoring: process.env.ENABLE_AI_SCORING !== 'false',
    enableAuditLogging: process.env.ENABLE_AUDIT_LOGGING !== 'false',
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Helper methods
  isDevelopment: () => config.nodeEnv === 'development',
  isProduction: () => config.nodeEnv === 'production',
  isTest: () => config.nodeEnv === 'test',

  // Generate full URLs
  getActivationUrl: (token) => `${config.frontendUrl}/onboarding/accept?token=${token}`,
  getResetPasswordUrl: (token) => `${config.frontendUrl}/reset-password?token=${token}`,
  getOnboardingPortalUrl: () => `${config.frontendUrl}/onboarding`,
  getDashboardUrl: () => `${config.frontendUrl}/`,
  getNdaUrl: (ndaId) => `${config.frontendUrl}/documents${ndaId ? `?ndaId=${ndaId}` : ''}`,
  getDocumentsUrl: () => `${config.frontendUrl}/documents`,

  // Validate critical config
  validate: () => {
    const errors = [];

    if (!config.jwtSecret || config.jwtSecret === 'dev-secret-key-change-in-production') {
      if (config.isProduction()) {
        errors.push('JWT_SECRET must be set in production');
      }
    }

    if (!config.mongodbUri) {
      errors.push('MONGODB_URI is required');
    }

    if (config.features.enableEmailQueue && (!config.smtp.user || !config.smtp.password)) {
      console.warn('⚠️  Email queue enabled but SMTP credentials not configured. Emails will fail.');
    }

    if (config.features.enableAiScoring && !config.groq.apiKey) {
      console.warn('⚠️  AI scoring enabled but GROQ_API_KEY not configured. AI features will fail.');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration errors:\n${errors.join('\n')}`);
    }

    return true;
  },

  // Print configuration (safe for logging)
  printConfig: () => {
    console.log('\n📋 Configuration:');
    console.log('=====================================');
    console.log(`Environment:      ${config.nodeEnv}`);
    console.log(`Port:             ${config.port}`);
    console.log(`Frontend URL:     ${config.frontendUrl}`);
    console.log(`Backend URL:      ${config.backendUrl}`);
    console.log(`CORS Origin:      ${config.corsOrigin}`);
    console.log(`MongoDB:          ${config.mongodbUri.replace(/:[^:]*@/, ':****@')}`);
    console.log(`Email Queue:      ${config.features.enableEmailQueue ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`AI Scoring:       ${config.features.enableAiScoring ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`Audit Logging:    ${config.features.enableAuditLogging ? '✅ Enabled' : '❌ Disabled'}`);
    console.log('=====================================\n');
  },
};

module.exports = config;
