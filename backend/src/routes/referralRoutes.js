const express = require('express');
const router = express.Router();
const { listReferrals, createReferral } = require('../controllers/referralController');

router.get('/', listReferrals);
router.post('/', createReferral);

module.exports = router;
