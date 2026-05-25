const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    resourceType: { type: String, required: true, trim: true },
    resourceId: { type: mongoose.Types.ObjectId }, // Made optional for non-entity events
    resourceKey: { type: String, trim: true }, // For string identifiers like 'overview', 'dashboard'
    performedBy: { type: String, trim: true },
    performedById: { type: mongoose.Types.ObjectId, ref: 'User' },
    details: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', AuditLogSchema);
