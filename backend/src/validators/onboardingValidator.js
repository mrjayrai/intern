const { WORKFLOW_STAGES } = require('../constants/workflowStages');

const parseJsonField = (value) => {
  if (!value) return undefined;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeArrayField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseJsonField(value);
    if (Array.isArray(parsed)) return parsed;
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateOnboardingPayload = (payload = {}, isUpdate = false) => {
  const errors = [];

  if (payload.candidateEmail && !validateEmail(payload.candidateEmail)) {
    errors.push('candidateEmail must be a valid email address');
  }

  if (payload.status && !['DRAFT', 'SUBMITTED', 'HR_APPROVED'].includes(payload.status)) {
    errors.push('status must be one of DRAFT, SUBMITTED, or HR_APPROVED');
  }

  if (payload.workflowStage && !Object.values(WORKFLOW_STAGES).includes(payload.workflowStage)) {
    errors.push('workflowStage is invalid');
  }

  if (payload.personalDetails && typeof payload.personalDetails !== 'object') {
    errors.push('personalDetails must be an object');
  }

  if (payload.emergencyContact && typeof payload.emergencyContact !== 'object') {
    errors.push('emergencyContact must be an object');
  }

  if (payload.permanentAddress && typeof payload.permanentAddress !== 'object') {
    errors.push('permanentAddress must be an object');
  }

  if (payload.currentAddress && typeof payload.currentAddress !== 'object') {
    errors.push('currentAddress must be an object');
  }

  if (payload.govtIds && !Array.isArray(payload.govtIds)) {
    errors.push('govtIds must be an array');
  }

  if (payload.educationDetails && !Array.isArray(payload.educationDetails)) {
    errors.push('educationDetails must be an array');
  }

  if (payload.attachments && !Array.isArray(payload.attachments)) {
    errors.push('attachments must be an array');
  }

  return errors;
};

const validateOnboardingSubmission = (payload = {}) => {
  const errors = validateOnboardingPayload(payload, true);
  const personalDetails = payload.personalDetails || {};
  const emergencyContact = payload.emergencyContact || {};
  const permanentAddress = payload.permanentAddress || {};
  const currentAddress = payload.currentAddress || {};
  const declarations = payload.declarations || {};
  const govtIds = normalizeArrayField(payload.govtIds);
  const educationDetails = normalizeArrayField(payload.educationDetails);

  if (!personalDetails.firstName) {
    errors.push('personalDetails.firstName is required');
  }
  if (!personalDetails.lastName) {
    errors.push('personalDetails.lastName is required');
  }
  if (!personalDetails.email || !validateEmail(personalDetails.email)) {
    errors.push('personalDetails.email must be a valid email address');
  }
  if (!personalDetails.phone) {
    errors.push('personalDetails.phone is required');
  }

  if (!emergencyContact.name) {
    errors.push('emergencyContact.name is required');
  }
  if (!emergencyContact.relationship) {
    errors.push('emergencyContact.relationship is required');
  }
  if (!emergencyContact.phone) {
    errors.push('emergencyContact.phone is required');
  }

  if (!permanentAddress.addressLine1) {
    errors.push('permanentAddress.addressLine1 is required');
  }
  if (!permanentAddress.city) {
    errors.push('permanentAddress.city is required');
  }
  if (!permanentAddress.state) {
    errors.push('permanentAddress.state is required');
  }
  if (!permanentAddress.pincode) {
    errors.push('permanentAddress.pincode is required');
  }

  if (!currentAddress.addressLine1) {
    errors.push('currentAddress.addressLine1 is required');
  }
  if (!currentAddress.city) {
    errors.push('currentAddress.city is required');
  }
  if (!currentAddress.state) {
    errors.push('currentAddress.state is required');
  }
  if (!currentAddress.pincode) {
    errors.push('currentAddress.pincode is required');
  }

  if (!govtIds.length) {
    errors.push('At least one government ID record is required');
  }

  if (!educationDetails.length) {
    errors.push('educationDetails is required');
  }

  if (!declarations.agreeToPolicies) {
    errors.push('declarations.agreeToPolicies must be accepted');
  }
  if (!declarations.signature) {
    errors.push('declarations.signature is required');
  }

  return errors;
};

const buildOnboardingPayload = (body = {}) => {
  const payload = {};
  const source = body.payload ? parseJsonField(body.payload) : body;

  payload.candidateId = source.candidateId;
  payload.referralId = source.referralId;
  payload.candidateEmail = source.candidateEmail;
  payload.candidateName = source.candidateName;
  payload.personalDetails = parseJsonField(source.personalDetails) || {};
  payload.emergencyContact = parseJsonField(source.emergencyContact) || {};
  payload.permanentAddress = parseJsonField(source.permanentAddress) || {};
  payload.currentAddress = parseJsonField(source.currentAddress) || {};
  payload.govtIds = normalizeArrayField(source.govtIds);
  payload.educationDetails = normalizeArrayField(source.educationDetails);
  payload.declarations = parseJsonField(source.declarations) || {};
  payload.status = source.status;
  payload.workflowStage = source.workflowStage;
  payload.approval = parseJsonField(source.approval) || {};

  return payload;
};

module.exports = {
  validateOnboardingPayload,
  validateOnboardingSubmission,
  buildOnboardingPayload,
};
