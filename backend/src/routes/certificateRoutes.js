const express = require('express');
const router = express.Router();
const { listCertificates, issueCertificate } = require('../controllers/certificateController');

router.get('/', listCertificates);
router.post('/', issueCertificate);

module.exports = router;
