const mongoose = require('mongoose');

const validateCertificatePayload = (payload) => {
  const errors = [];
  const candidate = payload.candidate || payload.candidateName;
  const mentor = payload.mentor || payload.mentorName;
  const internshipDuration = payload.internshipDuration || payload.internshipPeriod;

  if (!candidate || typeof candidate !== 'string' || !candidate.trim()) {
    errors.push('candidate is required');
  }

  if (!mentor || typeof mentor !== 'string' || !mentor.trim()) {
    errors.push('mentor is required');
  }

  if (!internshipDuration || typeof internshipDuration !== 'string' || !internshipDuration.trim()) {
    errors.push('internshipDuration is required');
  }

  if (!payload.completionDate) {
    errors.push('completionDate is required');
  } else {
    const completionDate = new Date(payload.completionDate);
    if (Number.isNaN(completionDate.getTime())) {
      errors.push('completionDate must be a valid date');
    }
  }

  if (payload.verificationId && typeof payload.verificationId !== 'string') {
    errors.push('verificationId must be a string');
  }

  if (payload.referralId && !mongoose.Types.ObjectId.isValid(payload.referralId)) {
    errors.push('referralId must be a valid id');
  }

  return errors;
};

module.exports = {
  validateCertificatePayload,
};
