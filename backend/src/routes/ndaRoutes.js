const express = require('express');
const router = express.Router();
const { listNDAs, submitNDA } = require('../controllers/ndaController');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { ROLES } = require('../constants/roles');

router.use(authMiddleware);

router.get('/', listNDAs);
router.post('/', authorize([ROLES.CANDIDATE, ROLES.HR, ROLES.COMPLIANCE, ROLES.SUPER_ADMIN]), submitNDA);

module.exports = router;
