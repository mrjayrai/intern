const mongoose = require('mongoose');

const WorkflowHistorySchema = new mongoose.Schema(
  {
    referralId: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', required: true, index: true },
    fromStage: { type: String, required: true, trim: true },
    toStage: { type: String, required: true, trim: true },
    performedBy: { type: String, trim: true },
    performedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, trim: true },
    slaDeadline: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkflowHistory', WorkflowHistorySchema);
