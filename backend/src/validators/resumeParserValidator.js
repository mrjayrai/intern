const path = require('path');

const validateResumeFile = (file) => {
  const errors = [];
  if (!file) {
    errors.push('Resume file is required');
    return errors;
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (!['.pdf', '.docx'].includes(ext)) {
    errors.push('Only PDF and DOCX resume files are allowed');
  }

  if (!file.path) {
    errors.push('Uploaded file path is missing');
  }

  return errors;
};

const validateParsedData = (parsedData) => {
  const warnings = [];
  if (!parsedData.fullName.value) {
    warnings.push('Full name could not be confidently detected');
  }
  if (!parsedData.email.value) {
    warnings.push('Email could not be confidently detected');
  }
  if (!parsedData.phone.value) {
    warnings.push('Phone number could not be confidently detected');
  }
  return warnings;
};

module.exports = {
  validateResumeFile,
  validateParsedData,
};
