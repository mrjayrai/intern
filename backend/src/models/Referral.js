const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema(
  {
    candidateName: { type: String, required: true, trim: true },
    candidateEmail: { type: String, required: true, trim: true, lowercase: true },
    candidatePhone: { type: String, required: true, trim: true },
    resume: { type: String },
    skills: { type: [String], default: [] },
    education: { type: String, trim: true },
    mentor: { type: String, trim: true },
    referrer: { type: String, trim: true },
    status: { type: String, trim: true, default: 'pending' },
    internshipDuration: { type: String, trim: true },
    projectOverview: { type: String, trim: true },
    location: { type: String, trim: true },
    workflowStage: { type: String, trim: true, default: 'new' },
    slaDeadline: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Referral', ReferralSchema);
