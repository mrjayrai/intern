const asyncHandler = require('../utils/asyncHandler');
const referralService = require('../services/referralService');
const { validateReferralPayload, buildReferralPayload } = require('../validators/referralValidator');
const { ROLES } = require('../constants/roles');
const ApiError = require('../utils/apiError');

exports.listReferrals = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.user.role === ROLES.CANDIDATE) {
    filters.candidateEmail = req.user.email;
  }

  const referrals = await referralService.getAllReferrals(filters);
  res.status(200).json({ success: true, data: referrals });
});

exports.getReferralById = asyncHandler(async (req, res) => {
  const referral = await referralService.getReferralById(req.params.id);
  if (!referral) {
    throw new ApiError(404, 'Referral not found');
  }
  res.status(200).json({ success: true, data: referral });
});

exports.createReferral = asyncHandler(async (req, res) => {
  const errors = validateReferralPayload(req.body);
  if (errors.length) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  const payload = buildReferralPayload(req.body, req.file);
  const referral = await referralService.createReferral(payload, req.user);
  res.status(201).json({ success: true, data: referral });
});

exports.updateReferral = asyncHandler(async (req, res) => {
  const errors = validateReferralPayload(req.body, true);
  if (errors.length) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  const payload = buildReferralPayload(req.body, req.file);
  const referral = await referralService.updateReferral(req.params.id, payload, req.user);
  if (!referral) {
    throw new ApiError(404, 'Referral not found');
  }
  res.status(200).json({ success: true, data: referral });
});

exports.deleteReferral = asyncHandler(async (req, res) => {
  const referral = await referralService.deleteReferral(req.params.id, req.user);
  if (!referral) {
    throw new ApiError(404, 'Referral not found');
  }
  res.status(200).json({ success: true, message: 'Referral deleted successfully' });
});
