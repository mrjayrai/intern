const validateNdaUpload = (req) => {
  const errors = [];
  const { referralId } = req.params || {};
  if (!referralId) errors.push('referralId is required in params');
  if (!req.file) errors.push('NDA file is required');
  return errors;
};

const validateNdaSign = (body, params) => {
  const errors = [];
  const { referralId } = params || {};
  if (!referralId) errors.push('referralId is required in params');
  // optionally require signer name in body
  if (!body.signedBy) errors.push('signedBy is required');
  return errors;
};

module.exports = {
  validateNdaUpload,
  validateNdaSign,
};
