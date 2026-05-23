const mongoose = require('mongoose');

const AccessProvisionSchema = new mongoose.Schema(
  {
    referralId: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    adAccountCreated: { type: Boolean, default: false },
    emailProvisioned: { type: Boolean, default: false },
    vpnAccess: { type: Boolean, default: false },
    badgeAccess: { type: Boolean, default: false },
    systemAccess: { type: [String], default: [] },
    otpSent: { type: Boolean, default: false },
    provisioningStatus: { type: String, enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'], default: 'NOT_STARTED', index: true },
    slaDeadline: { type: Date },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

AccessProvisionSchema.index({ candidateId: 1, provisioningStatus: 1 });

module.exports = mongoose.model('AccessProvision', AccessProvisionSchema);
