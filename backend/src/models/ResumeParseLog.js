const mongoose = require('mongoose');

const ResumeParseLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: 'User' },
    fileName: { type: String, trim: true },
    filePath: { type: String, trim: true },
    sourceType: { type: String, trim: true, index: true },
    textHash: { type: String, trim: true, index: true },
    status: { type: String, trim: true, enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' },
    parsedData: { type: mongoose.Schema.Types.Mixed },
    confidence: { type: mongoose.Schema.Types.Mixed },
    duplicate: { type: Boolean, default: false },
    duplicateReason: { type: String, trim: true },
    errors: { type: [String], default: [] },
    warnings: { type: [String], default: [] },
    requestPayload: { type: mongoose.Schema.Types.Mixed },
    responsePayload: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ResumeParseLog', ResumeParseLogSchema);
