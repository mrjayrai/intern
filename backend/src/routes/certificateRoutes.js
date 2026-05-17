const express = require('express');
const router = express.Router();
const { listCertificates, issueCertificate } = require('../controllers/certificateController');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { ROLES } = require('../constants/roles');

router.use(authMiddleware);

router.get('/', listCertificates);
router.post('/', authorize([ROLES.HR, ROLES.MENTOR, ROLES.SUPER_ADMIN]), issueCertificate);

module.exports = router;
