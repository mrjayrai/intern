const mongoose = require('mongoose');

const validateCertificatePayload = (payload) => {
  const errors = [];

  if (!payload.candidate || typeof payload.candidate !== 'string' || !payload.candidate.trim()) {
    errors.push('candidate is required');
  }

  if (!payload.mentor || typeof payload.mentor !== 'string' || !payload.mentor.trim()) {
    errors.push('mentor is required');
  }

  if (!payload.internshipDuration || typeof payload.internshipDuration !== 'string' || !payload.internshipDuration.trim()) {
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
