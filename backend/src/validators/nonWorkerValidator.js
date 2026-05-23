const validateNonWorkerPayload = (payload = {}, isUpdate = false) => {
  const errors = [];
  if (!isUpdate) {
    if (!payload.candidateId) errors.push('candidateId is required');
    if (!payload.candidateEmail) errors.push('candidateEmail is required');
  }

  if (payload.candidateEmail && typeof payload.candidateEmail === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.candidateEmail)) errors.push('candidateEmail must be valid');
  }

  return errors;
};

module.exports = { validateNonWorkerPayload };
