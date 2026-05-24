const mongoose = require('mongoose');

const WorkflowHistorySchema = new mongoose.Schema(
  {
    referralId: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', index: true },
    onboardingId: { type: mongoose.Schema.Types.ObjectId, ref: 'JoiningForm', index: true },
    workflowStage: { type: String, trim: true, index: true },
    previousStage: { type: String, trim: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String, trim: true },
    actorRole: { type: String, trim: true },
    action: { type: String, trim: true },
    notes: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
    durationInStage: { type: Number }, // seconds
  },
  { timestamps: true }
);

// Indexes to optimise common timeline queries
WorkflowHistorySchema.index({ referralId: 1, createdAt: -1 });
WorkflowHistorySchema.index({ onboardingId: 1, createdAt: -1 });



module.exports = mongoose.model('WorkflowHistory', WorkflowHistorySchema);