const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const accessService = require('../services/accessProvisionService');
const { validateAccessProvisionPayload } = require('../validators/accessProvisionValidator');

exports.create = asyncHandler(async (req, res) => {
  logger.info(`Create AccessProvision payload: ${JSON.stringify(req.body || {})}`);
  const errors = validateAccessProvisionPayload(req.body || {});
  if (errors.length) return res.status(400).json({ success: false, errors });

  const rec = await accessService.createProvision(req.body, req.user);
  res.status(201).json({ success: true, data: rec });
});

exports.list = asyncHandler(async (req, res) => {
  const docs = await accessService.listProvisions(req.query || {});
  res.status(200).json({ success: true, data: docs });
});

exports.get = asyncHandler(async (req, res) => {
  const doc = await accessService.getById(req.params.id);
  res.status(200).json({ success: true, data: doc });
});

exports.update = asyncHandler(async (req, res) => {
  logger.info(`Update AccessProvision ${req.params.id} payload: ${JSON.stringify(req.body || {})}`);
  const rec = await accessService.updateProvision(req.params.id, req.body, req.user);
  res.status(200).json({ success: true, data: rec });
});

exports.start = asyncHandler(async (req, res) => {
  const rec = await accessService.startProvision(req.params.id, req.user);
  res.status(200).json({ success: true, data: rec });
});

exports.complete = asyncHandler(async (req, res) => {
  const rec = await accessService.completeProvision(req.params.id, req.user);
  res.status(200).json({ success: true, data: rec });
});
