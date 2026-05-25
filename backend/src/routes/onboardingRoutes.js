const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { ROLES } = require('../constants/roles');
const { uploadOnboardingAttachments } = require('../middleware/uploadMiddleware');

router.use(authMiddleware);

router.get('/', authorize([ROLES.CANDIDATE, ROLES.HR, ROLES.SUPER_ADMIN]), onboardingController.getAllOnboardingForms);
router.post('/', authorize([ROLES.CANDIDATE, ROLES.HR, ROLES.SUPER_ADMIN]), uploadOnboardingAttachments, onboardingController.createOnboardingForm);
router.get('/:id', authorize([ROLES.CANDIDATE, ROLES.HR, ROLES.SUPER_ADMIN]), onboardingController.getOnboardingForm);
router.put('/:id', authorize([ROLES.CANDIDATE, ROLES.HR, ROLES.SUPER_ADMIN]), uploadOnboardingAttachments, onboardingController.updateOnboardingForm);
router.delete('/:id', authorize([ROLES.CANDIDATE, ROLES.HR, ROLES.SUPER_ADMIN]), onboardingController.deleteOnboardingForm);
router.post('/:id/submit', authorize([ROLES.CANDIDATE, ROLES.HR, ROLES.SUPER_ADMIN]), onboardingController.submitOnboardingForm);
router.post('/:id/approve', authorize([ROLES.HR, ROLES.SUPER_ADMIN]), onboardingController.approveOnboardingForm);

module.exports = router;
