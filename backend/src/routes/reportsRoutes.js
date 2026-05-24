const express = require('express');
const router = express.Router();
const {
  getOverviewReport,
  getOnboardingReport,
  getReferralConversionReport,
  getSLAReport,
  getWorkflowReport,
  getMentorReport,
  getReferrerReport,
  getProvisioningReport,
  getTimelineReport,
  exportCSV,
  exportPDF,
} = require('../controllers/reportsController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication to all report routes
router.use(authMiddleware);

/**
 * Analytics Report Endpoints
 */

// Overview metrics
router.get('/overview', getOverviewReport);

// Onboarding funnel analytics
router.get('/onboarding', getOnboardingReport);

// Referral conversion metrics
router.get('/referrals', getReferralConversionReport);

// SLA performance metrics
router.get('/sla', getSLAReport);

// Workflow bottlenecks and completion metrics
router.get('/workflows', getWorkflowReport);

// Mentor analytics
router.get('/mentors', getMentorReport);

// Referrer analytics
router.get('/referrers', getReferrerReport);

// Access provisioning metrics
router.get('/provisioning', getProvisioningReport);

// Timeline trends
router.get('/timeline', getTimelineReport);

/**
 * Export Endpoints
 */

// Export as CSV
router.get('/export/csv', exportCSV);

// Export as PDF
router.get('/export/pdf', exportPDF);

module.exports = router;
