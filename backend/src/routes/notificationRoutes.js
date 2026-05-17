const express = require('express');
const router = express.Router();
const { listNotifications } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', listNotifications);

module.exports = router;
