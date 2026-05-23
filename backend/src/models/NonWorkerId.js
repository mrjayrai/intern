const mongoose = require('mongoose');

const NonWorkerIdSchema = new mongoose.Schema(
  {
    referralId: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    candidateName: { type: String, trim: true },
    candidateEmail: { type: String, trim: true, lowercase: true },
    employeeId: { type: String, trim: true },
    requestStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'], default: 'PENDING', index: true },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    completedAt: { type: Date },
    rejectedAt: { type: Date },
    slaDeadline: { type: Date },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

NonWorkerIdSchema.index({ candidateId: 1, requestStatus: 1 });

module.exports = mongoose.model('NonWorkerId', NonWorkerIdSchema);
