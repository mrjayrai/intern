const mongoose = require('mongoose');

const ExtensionRequestSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, trim: true },
    requestedDays: { type: Number, default: 0 },
    approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', index: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comments: { type: String, trim: true },
  },
  { timestamps: true }
);

ExtensionRequestSchema.index({ candidateId: 1, approvalStatus: 1 });

module.exports = mongoose.model('ExtensionRequest', ExtensionRequestSchema);
