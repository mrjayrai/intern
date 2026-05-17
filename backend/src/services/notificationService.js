const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Referral = require('../models/Referral');
const auditService = require('./auditService');
const ApiError = require('../utils/apiError');
const { WORKFLOW_STAGES } = require('../constants/workflowStages');

const buildPagination = (page = 1, limit = 20) => {
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  };
};

const createNotification = async ({ user, title, message, type = 'GENERAL', workflowStage, metadata = {}, performedByName = 'System', performedById = null }) => {
  if (!user || !mongoose.Types.ObjectId.isValid(user)) {
    throw new ApiError(400, 'Notification user is required');
  }

  const notification = await Notification.create({
    user,
    title,
    message,
    type,
    workflowStage,
    metadata,
  });

  await auditService.createAuditLog({
    action: 'CREATE',
    resourceType: 'Notification',
    resourceId: notification._id,
    performedBy: performedByName,
    performedById: performedById || user,
    details: {
      title,
      message,
      type,
      workflowStage,
      metadata,
      user,
    },
  });

  return notification;
};

const listNotifications = async ({ userId, page, limit, sortBy = 'createdAt', sortOrder = 'desc', filters = {} }) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'Invalid user id');
  }

  const { skip, limit: pageLimit, page: currentPage } = buildPagination(page, limit);
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const query = { user: userId };

  if (filters.type) query.type = filters.type;
  if (typeof filters.isRead === 'boolean') query.isRead = filters.isRead;
  if (filters.workflowStage) query.workflowStage = filters.workflowStage;

  const [data, total] = await Promise.all([
    Notification.find(query)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(pageLimit)
      .lean(),
    Notification.countDocuments(query),
  ]);

  return {
    data,
    meta: {
      page: currentPage,
      limit: pageLimit,
      total,
      pages: Math.ceil(total / pageLimit),
    },
  };
};

const getUnreadCount = async (userId) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'Invalid user id');
  }

  return Notification.countDocuments({ user: userId, isRead: false });
};

const markNotificationRead = async (userId, notificationId) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'Invalid user id');
  }

  if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new ApiError(400, 'Invalid notification id');
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true, readAt: new Date() },
    { new: true },
  );

  return notification;
};

const markAllNotificationsRead = async (userId) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'Invalid user id');
  }

  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() },
  );

  await auditService.createAuditLog({
    action: 'UPDATE',
    resourceType: 'Notification',
    resourceId: userId,
    performedBy: 'System',
    performedById: userId,
    details: { action: 'mark_all_read' },
  });

  return result;
};

const hasSlaAlert = async (user, referralId, workflowStage) => {
  return Notification.exists({
    user,
    type: 'SLA_ALERT',
    'metadata.referralId': referralId,
    workflowStage,
  });
};

const createSlaAlertNotifications = async () => {
  const now = new Date();
  const referrals = await Referral.find({
    slaDeadline: { $exists: true, $lt: now },
    workflowStage: { $nin: [WORKFLOW_STAGES.COMPLETED, WORKFLOW_STAGES.CLOSED] },
  });

  for (const referral of referrals) {
    const recipients = [referral.referrer, referral.mentor].filter((recipient) => recipient && mongoose.Types.ObjectId.isValid(recipient));
    const seen = new Set();

    for (const recipient of recipients) {
      const recipientId = recipient.toString();
      if (seen.has(recipientId)) continue;
      seen.add(recipientId);

      const existing = await hasSlaAlert(recipient, referral._id, referral.workflowStage);
      if (existing) {
        continue;
      }

      await createNotification({
        user: recipient,
        title: `SLA alert for ${referral.candidateName}`,
        message: `Referral is past SLA deadline for stage ${referral.workflowStage}.`,
        type: 'SLA_ALERT',
        workflowStage: referral.workflowStage,
        metadata: {
          referralId: referral._id,
          candidateName: referral.candidateName,
          slaDeadline: referral.slaDeadline,
        },
        performedByName: 'System',
      });
    }
  }
};

module.exports = {
  createNotification,
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  createSlaAlertNotifications,
};
