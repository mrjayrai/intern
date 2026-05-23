const validateAccessProvisionPayload = (payload = {}, isUpdate = false) => {
  const errors = [];
  if (!isUpdate) {
    if (!payload.candidateId) errors.push('candidateId is required');
  }

  if (payload.provisioningStatus && !['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'].includes(payload.provisioningStatus)) {
    errors.push('provisioningStatus is invalid');
  }

  return errors;
};

module.exports = { validateAccessProvisionPayload };
