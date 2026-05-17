const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { uploadResume } = require('../middleware/uploadMiddleware');

router.get('/', referralController.listReferrals);
router.post('/', uploadResume, referralController.createReferral);
router.get('/:id', referralController.getReferralById);
router.put('/:id', uploadResume, referralController.updateReferral);
router.delete('/:id', referralController.deleteReferral);

module.exports = router;
