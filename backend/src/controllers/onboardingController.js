const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const onboardingService = require('../services/onboardingService');
const { validateOnboardingPayload, validateOnboardingSubmission, buildOnboardingPayload } = require('../validators/onboardingValidator');

exports.createOnboardingForm = asyncHandler(async (req, res) => {
  logger.info(`Onboarding create request body: ${JSON.stringify(req.body || {})}`);
  const payload = buildOnboardingPayload(req.body || {});
  const errors = validateOnboardingPayload(payload, true);
  if (errors.length) {
    logger.warn(`Onboarding validation errors: ${JSON.stringify(errors)}`);
    throw new ApiError(400, 'Validation failed', errors);
  }

  const form = await onboardingService.createJoiningFormDraft(payload, req.user, req.files || []);
  res.status(201).json({ success: true, data: form });
});

exports.getOnboardingForm = asyncHandler(async (req, res) => {
  const form = await onboardingService.getJoiningFormById(req.params.id, req.user);
  res.status(200).json({ success: true, data: form });
});

exports.updateOnboardingForm = asyncHandler(async (req, res) => {
  logger.info(`Onboarding update request body: ${JSON.stringify(req.body || {})}`);
  const payload = buildOnboardingPayload(req.body || {});
  const errors = validateOnboardingPayload(payload, true);
  if (errors.length) {
    logger.warn(`Onboarding validation errors: ${JSON.stringify(errors)}`);
    throw new ApiError(400, 'Validation failed', errors);
  }

  const form = await onboardingService.updateJoiningForm(req.params.id, payload, req.user, req.files || []);
  res.status(200).json({ success: true, data: form });
});

exports.submitOnboardingForm = asyncHandler(async (req, res) => {
  logger.info(`Onboarding submit request body: ${JSON.stringify(req.body || {})}`);
  const form = await onboardingService.submitJoiningForm(req.params.id, req.user, (payload) => {
    const errors = validateOnboardingSubmission(payload);
    if (errors && errors.length) logger.warn(`Onboarding submit validation errors: ${JSON.stringify(errors)}`);
    return errors;
  });
  res.status(200).json({ success: true, data: form });
});

exports.approveOnboardingForm = asyncHandler(async (req, res) => {
  const comment = req.body.comment || '';
  const form = await onboardingService.approveJoiningForm(req.params.id, req.user, comment);
  res.status(200).json({ success: true, data: form });
});

exports.deleteOnboardingForm = asyncHandler(async (req, res) => {
  const result = await onboardingService.deleteJoiningFormDraft(req.params.id, req.user);
  res.status(200).json({ success: true, data: result });
});

exports.getAllOnboardingForms = asyncHandler(async (req, res) => {
  const forms = await onboardingService.getAllJoiningForms(req.user);
  res.status(200).json({ success: true, data: forms });
});
