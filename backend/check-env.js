#!/usr/bin/env node
/**
 * Environment Configuration Checker
 * Run: node check-env.js
 */

require('dotenv').config();
const config = require('./src/config/environment');

console.log('\n🔍 Checking Intern Flow Environment Configuration...\n');

let errors = 0;
let warnings = 0;

// Helper functions
function checkRequired(key, value, name) {
  if (!value) {
    console.log(`❌ MISSING: ${name} (${key})`);
    errors++;
    return false;
  }
  console.log(`✅ ${name}: ${value}`);
  return true;
}

function checkOptional(key, value, name) {
  if (!value) {
    console.log(`⚠️  OPTIONAL: ${name} (${key}) - Not configured`);
    warnings++;
    return false;
  }
  console.log(`✅ ${name}: ${value}`);
  return true;
}

function checkPort(port, name) {
  if (!port || isNaN(port)) {
    console.log(`❌ INVALID: ${name} port is not a number`);
    errors++;
    return false;
  }
  console.log(`✅ ${name} Port: ${port}`);
  return true;
}

console.log('═══════════════════════════════════════');
console.log('CRITICAL CONFIGURATION');
console.log('═══════════════════════════════════════\n');

checkRequired('MONGODB_URI', config.mongodbUri, 'MongoDB URI');
checkRequired('JWT_SECRET', config.jwtSecret, 'JWT Secret');
checkPort(config.port, 'Backend');

console.log('\n═══════════════════════════════════════');
console.log('URL CONFIGURATION');
console.log('═══════════════════════════════════════\n');

checkRequired('FRONTEND_URL', config.frontendUrl, 'Frontend URL');
checkRequired('BACKEND_URL', config.backendUrl, 'Backend URL');
checkRequired('CORS_ORIGIN', config.corsOrigin, 'CORS Origin');

// Validate URLs match environment
if (config.isDevelopment()) {
  console.log('\n🔵 Development Mode Detected');
  if (!config.frontendUrl.includes('localhost')) {
    console.log(`⚠️  WARNING: Frontend URL should be localhost in development`);
    warnings++;
  }
  if (!config.backendUrl.includes('localhost')) {
    console.log(`⚠️  WARNING: Backend URL should be localhost in development`);
    warnings++;
  }
} else if (config.isProduction()) {
  console.log('\n🟢 Production Mode Detected');
  if (config.frontendUrl.includes('localhost')) {
    console.log(`❌ ERROR: Frontend URL should NOT be localhost in production`);
    errors++;
  }
  if (config.backendUrl.includes('localhost')) {
    console.log(`❌ ERROR: Backend URL should NOT be localhost in production`);
    errors++;
  }
  if (config.jwtSecret === 'dev-secret-key-change-in-production') {
    console.log(`❌ ERROR: JWT_SECRET must be changed in production`);
    errors++;
  }
}

console.log('\n═══════════════════════════════════════');
console.log('FEATURE CONFIGURATION');
console.log('═══════════════════════════════════════\n');

console.log(`${config.features.enableEmailQueue ? '✅' : '⚠️ '} Email Queue: ${config.features.enableEmailQueue ? 'Enabled' : 'Disabled'}`);
console.log(`${config.features.enableAiScoring ? '✅' : '⚠️ '} AI Scoring: ${config.features.enableAiScoring ? 'Enabled' : 'Disabled'}`);
console.log(`${config.features.enableAuditLogging ? '✅' : '⚠️ '} Audit Logging: ${config.features.enableAuditLogging ? 'Enabled' : 'Disabled'}`);

console.log('\n═══════════════════════════════════════');
console.log('EMAIL CONFIGURATION');
console.log('═══════════════════════════════════════\n');

if (config.features.enableEmailQueue) {
  checkRequired('SMTP_HOST', config.smtp.host, 'SMTP Host');
  checkRequired('SMTP_PORT', config.smtp.port, 'SMTP Port');
  checkRequired('SMTP_USER', config.smtp.user, 'SMTP User');
  checkRequired('SMTP_PASSWORD', config.smtp.password, 'SMTP Password');
  checkRequired('EMAIL_FROM', config.email.from, 'Email From Address');
} else {
  console.log('⚠️  Email queue disabled - skipping email configuration check');
  warnings++;
}

console.log('\n═══════════════════════════════════════');
console.log('AI CONFIGURATION');
console.log('═══════════════════════════════════════\n');

if (config.features.enableAiScoring) {
  checkRequired('GROQ_API_KEY', config.groq.apiKey, 'Groq API Key');
  checkRequired('GROQ_MODEL', config.groq.model, 'Groq Model');
} else {
  console.log('⚠️  AI scoring disabled - skipping AI configuration check');
  warnings++;
}

console.log('\n═══════════════════════════════════════');
console.log('GENERATED URLS (for testing)');
console.log('═══════════════════════════════════════\n');

console.log('Sample activation URL:');
console.log(config.getActivationUrl('SAMPLE_TOKEN_123'));
console.log('\nOnboarding portal URL:');
console.log(config.getOnboardingPortalUrl());
console.log('\nDashboard URL:');
console.log(config.getDashboardUrl());

console.log('\n═══════════════════════════════════════');
console.log('SUMMARY');
console.log('═══════════════════════════════════════\n');

if (errors === 0 && warnings === 0) {
  console.log('🎉 Perfect! All configuration looks good.');
} else {
  if (errors > 0) {
    console.log(`❌ ${errors} error(s) found - Please fix these before running the application`);
  }
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} warning(s) found - Application will run but some features may not work`);
  }
}

console.log('\n📝 Configuration file: backend/.env');
console.log('📚 Setup guide: SETUP_GUIDE.md');
console.log('\n');

process.exit(errors > 0 ? 1 : 0);
