const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { ROLES } = require('../constants/roles');

router.use(authMiddleware);

// admin list email logs
router.get('/logs', authorize([ROLES.SUPER_ADMIN, ROLES.HR]), emailController.listLogs);

// retry a failed log
router.post('/logs/:id/retry', authorize([ROLES.SUPER_ADMIN, ROLES.HR]), emailController.retryLog);

// send test email
router.post('/test', authorize([ROLES.SUPER_ADMIN, ROLES.HR]), emailController.sendTest);

module.exports = router;
