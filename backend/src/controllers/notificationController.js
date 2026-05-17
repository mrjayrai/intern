const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notificationService');
const ApiError = require('../utils/apiError');

exports.listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, type, workflowStage, isRead } = req.query;
  const filters = {};

  if (type) filters.type = type;
  if (workflowStage) filters.workflowStage = workflowStage;
  if (typeof isRead !== 'undefined') {
    filters.isRead = isRead === 'true' || isRead === '1';
  }

  const result = await notificationService.listNotifications({
    userId: req.user.id,
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
  });

  res.status(200).json({ success: true, data: result.data, meta: result.meta });
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationRead(req.user.id, req.params.id);
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }
  res.status(200).json({ success: true, data: notification });
});

exports.markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllNotificationsRead(req.user.id);
  res.status(200).json({ success: true, data: { matched: result.matchedCount, modified: result.modifiedCount } });
});

exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  res.status(200).json({ success: true, data: { unreadCount: count } });
});
