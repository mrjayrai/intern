const mongoose = require('mongoose');
const { WORKFLOW_STAGES } = require('../constants/workflowStages');

const AddressSchema = new mongoose.Schema(
  {
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    pincode: { type: String, trim: true },
  },
  { _id: false }
);

const GovernmentIdSchema = new mongoose.Schema(
  {
    type: { type: String, trim: true },
    idNumber: { type: String, trim: true },
    documentPath: { type: String, trim: true },
  },
  { _id: false }
);

const EducationSchema = new mongoose.Schema(
  {
    institution: { type: String, trim: true },
    degree: { type: String, trim: true },
    fieldOfStudy: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    grade: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const AttachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, trim: true },
    originalName: { type: String, trim: true },
    path: { type: String, required: true, trim: true },
    mimeType: { type: String, trim: true },
    uploadedAt: { type: Date, default: Date.now },
    type: { type: String, trim: true, default: 'attachment' },
  },
  { _id: false }
);

const JoiningFormSchema = new mongoose.Schema(
  {
    referralId: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    candidateEmail: { type: String, required: true, lowercase: true, trim: true },
    candidateName: { type: String, trim: true },
    personalDetails: { type: Object, default: {} },
    emergencyContact: { type: Object, default: {} },
    permanentAddress: { type: AddressSchema, default: () => ({}) },
    currentAddress: { type: AddressSchema, default: () => ({}) },
    govtIds: { type: [GovernmentIdSchema], default: [] },
    educationDetails: { type: [EducationSchema], default: [] },
    declarations: {
      agreeToPolicies: { type: Boolean, default: false },
      agreeTerms: { type: Boolean, default: false },
      signature: { type: String, trim: true },
      declaredAt: { type: Date },
      additionalInfo: { type: String, trim: true },
    },
    attachments: { type: [AttachmentSchema], default: [] },
    status: { type: String, enum: ['DRAFT', 'SUBMITTED', 'HR_APPROVED'], default: 'DRAFT', index: true },
    approval: {
      approved: { type: Boolean, default: false },
      approvedBy: { type: String, trim: true },
      approvedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: { type: Date },
      comment: { type: String, trim: true },
    },
    workflowStage: { type: String, enum: Object.values(WORKFLOW_STAGES), default: WORKFLOW_STAGES.JOINING_FORM_PENDING, trim: true, index: true },
    completionPercentage: { type: Number, min: 0, max: 100, default: 0 },
    submittedAt: { type: Date },
    finalizedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

JoiningFormSchema.index({ candidateId: 1, status: 1, referralId: 1 });

module.exports = mongoose.model('JoiningForm', JoiningFormSchema);
