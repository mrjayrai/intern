const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema(
  {
    candidate: { type: String, required: true, trim: true },
    mentor: { type: String, required: true, trim: true },
    internshipDuration: { type: String, required: true, trim: true },
    completionDate: { type: Date, required: true },
    pdfPath: { type: String, required: true, trim: true },
    issuedBy: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    verificationId: { type: String, required: true, unique: true, index: true },
    referralId: { type: mongoose.Types.ObjectId, ref: 'Referral' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', CertificateSchema);
