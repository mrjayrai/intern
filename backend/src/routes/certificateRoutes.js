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

// All routes require authentication
router.use(authMiddleware);

router.get('/', listCertificates);
router.get('/:id', getCertificateById);
router.get('/download/:id', downloadCertificate);
router.post('/issue', authorize([ROLES.HR, ROLES.SUPER_ADMIN]), issueCertificate);

module.exports = router;
