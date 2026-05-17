const express = require('express');
const router = express.Router();
const {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', listNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markNotificationRead);
router.put('/read-all', markAllNotificationsRead);

module.exports = router;
