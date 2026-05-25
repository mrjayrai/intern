const express = require('express');
const router = express.Router();
const onboardingInviteController = require('../controllers/onboardingInviteController');

// Public routes (no auth required)
router.get('/validate/:token', onboardingInviteController.validateInviteToken);
router.post('/accept', onboardingInviteController.acceptInvite);
router.post('/check-email', onboardingInviteController.checkPendingInvite);

module.exports = router;
