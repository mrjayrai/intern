const ndaService = require('../services/ndaService');
const ApiError = require('../utils/apiError');
const { validateNdaUpload, validateNdaSign } = require('../validators/ndaValidator');

exports.uploadNda = async (req, res, next) => {
  try {
    const errors = validateNdaUpload(req);
    if (errors.length) return next(new ApiError(400, 'Invalid payload', errors));

    const actor = req.user || {};
    const nda = await ndaService.uploadNdaForReferral(req.params.referralId, req.file, actor);
    return res.status(201).json({ success: true, data: nda });
  } catch (err) {
    return next(err);
  }
};

exports.signNda = async (req, res, next) => {
  try {
    const errors = validateNdaSign(req.body, req.params);
    if (errors.length) return next(new ApiError(400, 'Invalid payload', errors));

    const actor = req.user || {};
    const signerInfo = { signedBy: req.body.signedBy, signedById: req.body.signedById };
    const nda = await ndaService.signNdaForReferral(req.params.referralId, signerInfo, actor);
    return res.status(200).json({ success: true, data: nda });
  } catch (err) {
    return next(err);
  }
};

exports.archiveNda = async (req, res, next) => {
  try {
    const reason = req.body.reason || '';
    const actor = req.user || {};
    const nda = await ndaService.archiveNda(req.params.referralId, reason, actor);
    return res.status(200).json({ success: true, data: nda });
  } catch (err) {
    return next(err);
  }
};

exports.getNda = async (req, res, next) => {
  try {
    const nda = await ndaService.getNdaByReferral(req.params.referralId);
    if (!nda) return next(new ApiError(404, 'NDA not found'));
    return res.status(200).json({ success: true, data: nda });
  } catch (err) {
    return next(err);
  }
};
const asyncHandler = require('../utils/asyncHandler');

exports.listNDAs = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: [], message: 'List NDAs placeholder' });
});

exports.submitNDA = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: req.body, message: 'Submit NDA placeholder' });
});
