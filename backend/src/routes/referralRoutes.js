const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { uploadResume } = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { ROLES } = require('../constants/roles');

router.use(authMiddleware);
router.get('/', referralController.listReferrals);
router.post('/', authorize([ROLES.REFERRER, ROLES.HR, ROLES.MENTOR, ROLES.SUPER_ADMIN]), uploadResume, referralController.createReferral);
router.get('/:id', referralController.getReferralById);
router.put('/:id', authorize([ROLES.HR, ROLES.MENTOR, ROLES.REFERRER, ROLES.IT, ROLES.COMPLIANCE, ROLES.SUPER_ADMIN]), uploadResume, referralController.updateReferral);
router.delete('/:id', authorize([ROLES.HR, ROLES.SUPER_ADMIN]), referralController.deleteReferral);
router.post('/:id/approve', authorize([ROLES.HR, ROLES.SUPER_ADMIN]), referralController.approveReferral);
router.post('/:id/reject', authorize([ROLES.HR, ROLES.SUPER_ADMIN]), referralController.rejectReferral);

module.exports = router;
