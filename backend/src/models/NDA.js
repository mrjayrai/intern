const mongoose = require('mongoose');
const { WORKFLOW_STAGES } = require('../constants/workflowStages');

const NDA_STATUSES = ['DRAFT', 'PENDING_SIGNATURE', 'SIGNED', 'APPROVED', 'REJECTED', 'EXPIRED', 'ARCHIVED'];

const Ndaschema = new mongoose.Schema(
  {
    referral: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    candidateName: { type: String, trim: true, index: true },
    candidateEmail: { type: String, trim: true, lowercase: true, index: true },
    documentUrl: { type: String },
    originalFilename: { type: String },
    documentType: { type: String, trim: true, uppercase: true, enum: ['PDF', 'DOC', 'DOCX'] },
    version: { type: Number, default: 1 },
    status: { type: String, trim: true, enum: NDA_STATUSES, default: 'DRAFT', index: true },
    uploadedBy: { type: String },
    uploadedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    signedAt: { type: Date },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    expiresAt: { type: Date },
    signatureName: { type: String, trim: true },
    signatureAccepted: { type: Boolean, default: false },
    ipAddress: { type: String },
    userAgent: { type: String },
    notes: { type: String, trim: true },
    workflowStage: { type: String, trim: true, enum: Object.values(WORKFLOW_STAGES), default: WORKFLOW_STAGES.NDA_PENDING, index: true },
  },
  { timestamps: true }
);

Ndaschema.index({ referral: 1, status: 1 });
Ndaschema.index({ candidateEmail: 1, workflowStage: 1 });

module.exports = mongoose.model('NDA', Ndaschema);
module.exports.NDA_STATUSES = NDA_STATUSES;
