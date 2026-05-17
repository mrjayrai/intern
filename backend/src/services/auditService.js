const AuditLog = require('../models/AuditLog');

const createAuditLog = async ({ action, resourceType, resourceId, performedBy, performedById, details }) => {
  const log = new AuditLog({ action, resourceType, resourceId, performedBy, performedById, details });
  return log.save();
};

module.exports = {
  createAuditLog,
};
