const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:candidateId', authMiddleware, trackingController.getTrackingByCandidate);
router.get('/activity-feed', authMiddleware, trackingController.getActivityFeed);
router.get('/workflow-history/:referralId', authMiddleware, trackingController.getWorkflowHistory);

router.post('/extension-request', authMiddleware, trackingController.createExtensionRequest);
router.post('/extension-request/:id/approve', authMiddleware, trackingController.approveExtensionRequest);
router.post('/extension-request/:id/reject', authMiddleware, trackingController.rejectExtensionRequest);

module.exports = router;
