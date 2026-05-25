const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

const isValidObjectId = (value) => {
  if (!value) return false;
  return mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === String(value);
};

const createAuditLog = async ({ action, resourceType, resourceId, resourceKey, performedBy, performedById, details }) => {
  try {
    const logData = {
      action,
      resourceType,
      performedBy,
      performedById,
      details,
    };

    // Intelligently assign resourceId or resourceKey based on the value
    if (resourceId) {
      if (isValidObjectId(resourceId)) {
        logData.resourceId = resourceId;
        console.log(`[Audit] Creating audit log with ObjectId: ${resourceId}`);
      } else {
        // If resourceId is provided but not a valid ObjectId, treat it as resourceKey
        logData.resourceKey = String(resourceId);
        console.log(`[Audit] Creating audit log with resourceKey: ${resourceId}`);
      }
    } else if (resourceKey) {
      logData.resourceKey = resourceKey;
      console.log(`[Audit] Creating audit log with resourceKey: ${resourceKey}`);
    }

    const log = new AuditLog(logData);
    await log.save();

    console.log(`[Audit] Audit log created: ${action} on ${resourceType}`);
    return log;
  } catch (error) {
    console.error('[Audit] Failed to create audit log:', error.message);
    console.error('[Audit] Audit data:', { action, resourceType, resourceId, resourceKey });
    // Don't throw - audit log failures shouldn't break the main flow
    return null;
  }
};

module.exports = {
  createAuditLog,
};
