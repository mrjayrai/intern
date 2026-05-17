const express = require('express');
const router = express.Router();
const {
  listCertificates,
  getCertificateById,
  issueCertificate,
  downloadCertificate,
} = require('../controllers/certificateController');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { ROLES } = require('../constants/roles');

router.get('/download/:id', downloadCertificate);

router.use(authMiddleware);

router.get('/', listCertificates);
router.get('/:id', getCertificateById);
router.post('/issue', authorize([ROLES.HR, ROLES.MENTOR, ROLES.SUPER_ADMIN]), issueCertificate);

module.exports = router;
