const mongoose = require('mongoose');
const { NDA_STATUSES } = require('../models/NDA');

const isValidObjectId = (id) => !!id && mongoose.Types.ObjectId.isValid(id);
const isValidDate = (value) => value && !Number.isNaN(new Date(value).getTime());

const validateNdaCreate = (body) => {
  const errors = [];
  if (!body.title || typeof body.title !== 'string') errors.push('title is required');
  if (body.candidateEmail && typeof body.candidateEmail !== 'string') errors.push('candidateEmail must be a string');
  if (body.candidateId && !isValidObjectId(body.candidateId)) errors.push('candidateId must be a valid id');
  if (body.expiresAt && !isValidDate(body.expiresAt)) errors.push('expiresAt must be a valid date');
  if (body.status && !NDA_STATUSES.includes(body.status)) errors.push('Invalid NDA status');
  return errors;
};

const validateNdaUpdate = (body, params) => {
  const errors = [];
  const { id } = params || {};
  if (!id || !isValidObjectId(id)) errors.push('id is required in params');
  if (body.candidateEmail && typeof body.candidateEmail !== 'string') errors.push('candidateEmail must be a string');
  if (body.candidateId && !isValidObjectId(body.candidateId)) errors.push('candidateId must be a valid id');
  if (body.expiresAt && !isValidDate(body.expiresAt)) errors.push('expiresAt must be a valid date');
  return errors;
};

const validateNdaSign = (body, params) => {
  const errors = [];
  const { id } = params || {};
  if (!id || !isValidObjectId(id)) errors.push('id is required in params');
  if (!body.signatureName || typeof body.signatureName !== 'string') errors.push('signatureName is required');
  if (body.signatureAccepted !== true) errors.push('signatureAccepted must be true');
  return errors;
};

const validateNdaAction = (body, params) => {
  const errors = [];
  const { id } = params || {};
  if (!id || !isValidObjectId(id)) errors.push('id is required in params');
  return errors;
};

const validateNdaReject = (body, params) => {
  const errors = validateNdaAction(body, params);
  if (body.notes && typeof body.notes !== 'string') errors.push('notes must be a string');
  return errors;
};

const validateNdaArchive = (body, params) => {
  const errors = validateNdaAction(body, params);
  if (body.reason && typeof body.reason !== 'string') errors.push('reason must be a string');
  return errors;
};

module.exports = {
  validateNdaCreate,
  validateNdaUpdate,
  validateNdaSign,
  validateNdaAction,
  validateNdaReject,
  validateNdaArchive,
};
