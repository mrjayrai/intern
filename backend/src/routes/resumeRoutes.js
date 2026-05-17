const express = require('express');
const router = express.Router();
const { parseResume } = require('../controllers/resumeParserController');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadResume } = require('../middleware/uploadMiddleware');

router.use(authMiddleware);
router.post('/parse', uploadResume, parseResume);

module.exports = router;
