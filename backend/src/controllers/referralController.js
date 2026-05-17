const asyncHandler = require('../utils/asyncHandler');
const referralService = require('../services/referralService');
const { validateReferralPayload, buildReferralPayload } = require('../validators/referralValidator');

exports.listReferrals = asyncHandler(async (req, res) => {
  const referrals = await referralService.getAllReferrals();
  res.status(200).json({ success: true, data: referrals });
});

exports.getReferralById = asyncHandler(async (req, res) => {
  const referral = await referralService.getReferralById(req.params.id);
  if (!referral) {
    return res.status(404).json({ success: false, message: 'Referral not found' });
  }
  res.status(200).json({ success: true, data: referral });
});

exports.createReferral = asyncHandler(async (req, res) => {
  const errors = validateReferralPayload(req.body);
  if (errors.length) return res.status(400).json({ success: false, errors });

  const payload = buildReferralPayload(req.body, req.file);
  const referral = await referralService.createReferral(payload);
  res.status(201).json({ success: true, data: referral });
});

exports.updateReferral = asyncHandler(async (req, res) => {
  const errors = validateReferralPayload(req.body, true);
  if (errors.length) return res.status(400).json({ success: false, errors });

  const payload = buildReferralPayload(req.body, req.file);
  const referral = await referralService.updateReferral(req.params.id, payload);
  if (!referral) {
    return res.status(404).json({ success: false, message: 'Referral not found' });
  }
  res.status(200).json({ success: true, data: referral });
});

exports.deleteReferral = asyncHandler(async (req, res) => {
  const referral = await referralService.deleteReferral(req.params.id);
  if (!referral) {
    return res.status(404).json({ success: false, message: 'Referral not found' });
  }
  res.status(200).json({ success: true, message: 'Referral deleted successfully' });
});
