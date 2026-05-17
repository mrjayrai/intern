const mongoose = require('mongoose');

const Ndaschema = new mongoose.Schema(
  {
    referral: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', required: true, index: true },
    filePath: { type: String, required: true },
    uploadedBy: { type: String },
    uploadedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
    signed: { type: Boolean, default: false, index: true },
    signedBy: { type: String },
    signedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    signedAt: { type: Date },
    archived: { type: Boolean, default: false },
    archiveReason: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

Ndaschema.index({ referral: 1, signed: 1 });

module.exports = mongoose.model('NDA', Ndaschema);
