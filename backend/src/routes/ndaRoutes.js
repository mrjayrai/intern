const express = require('express');
const router = express.Router({ mergeParams: true });
const ndaController = require('../controllers/ndaController');
const { uploadNda } = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { ROLES } = require('../constants/roles');

router.use(authMiddleware);

// upload NDA (allowed for referrer, hr, compliance, super_admin)
router.post('/:referralId/nda', authorize([ROLES.REFERRER, ROLES.HR, ROLES.COMPLIANCE, ROLES.SUPER_ADMIN]), uploadNda, ndaController.uploadNda);

// sign NDA (allowed for mentor, hr, referrer, super_admin)
router.post('/:referralId/nda/sign', authorize([ROLES.MENTOR, ROLES.HR, ROLES.REFERRER, ROLES.SUPER_ADMIN]), ndaController.signNda);

// archive NDA (admin actions)
router.post('/:referralId/nda/archive', authorize([ROLES.HR, ROLES.SUPER_ADMIN]), ndaController.archiveNda);

router.get('/:referralId/nda', authorize([ROLES.HR, ROLES.MENTOR, ROLES.REFERRER, ROLES.SUPER_ADMIN]), ndaController.getNda);

module.exports = router;

