const mongoose = require('mongoose');
const { WORKFLOW_STAGES } = require('../constants/workflowStages');

const ReferralSchema = new mongoose.Schema(
  {
    candidateName: { type: String, required: true, trim: true },
    candidateEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    candidatePhone: { type: String, required: true, trim: true },
    resume: { type: String },
    skills: { type: [String], default: [] },
    education: { type: String, trim: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, trim: true, default: 'PENDING', index: true },
    internshipDuration: { type: String, trim: true },
    projectOverview: { type: String, trim: true },
    location: { type: String, trim: true },
    workflowStage: { type: String, trim: true, enum: Object.values(WORKFLOW_STAGES), default: WORKFLOW_STAGES.REFERRED, index: true },
    slaDeadline: { type: Date },
    aiScore: { type: Number, min: 0, max: 100 },
    aiSummary: { type: String },
    aiRecommendation: { type: String, enum: ['STRONG_FIT', 'GOOD_FIT', 'MODERATE_FIT', 'WEAK_FIT', 'NOT_RECOMMENDED'] },
    aiStrengths: { type: [String], default: [] },
    aiWeaknesses: { type: [String], default: [] },
    aiSkillsExtracted: { type: [String], default: [] },
    aiProcessedAt: { type: Date },
  },
  { timestamps: true }
);

ReferralSchema.index({ workflowStage: 1, status: 1 });
ReferralSchema.index({ referrer: 1 });
ReferralSchema.index({ mentor: 1 });

module.exports = mongoose.model('Referral', ReferralSchema);
