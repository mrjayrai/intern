const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema(
  {
    to: { type: String, required: true, trim: true, index: true },
    from: { type: String, trim: true },
    subject: { type: String, trim: true },
    template: { type: String, trim: true },
    variables: { type: mongoose.Schema.Types.Mixed },
    attachments: { type: [mongoose.Schema.Types.Mixed], default: [] },
    status: { type: String, trim: true, default: 'queued', index: true },
    attempts: { type: Number, default: 0 },
    error: { type: String },
    lastAttemptAt: { type: Date },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailLog', EmailLogSchema);
