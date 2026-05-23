const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const nonWorkerIdService = require('../services/nonWorkerIdService');
const { validateNonWorkerPayload } = require('../validators/nonWorkerValidator');

exports.create = asyncHandler(async (req, res) => {
  logger.info(`Create NonWorkerId payload: ${JSON.stringify(req.body || {})}`);
  const errors = validateNonWorkerPayload(req.body || {});
  if (errors.length) return res.status(400).json({ success: false, errors });

  const rec = await nonWorkerIdService.createRequest(req.body, req.user);
  res.status(201).json({ success: true, data: rec });
});

exports.list = asyncHandler(async (req, res) => {
  const docs = await nonWorkerIdService.listRequests(req.query || {});
  res.status(200).json({ success: true, data: docs });
});

exports.get = asyncHandler(async (req, res) => {
  const doc = await nonWorkerIdService.getById(req.params.id);
  res.status(200).json({ success: true, data: doc });
});

exports.update = asyncHandler(async (req, res) => {
  logger.info(`Update NonWorkerId ${req.params.id} payload: ${JSON.stringify(req.body || {})}`);
  const rec = await nonWorkerIdService.updateRequest(req.params.id, req.body, req.user);
  res.status(200).json({ success: true, data: rec });
});

exports.approve = asyncHandler(async (req, res) => {
  const rec = await nonWorkerIdService.approveRequest(req.params.id, req.user, req.body.comment || '');
  res.status(200).json({ success: true, data: rec });
});

exports.reject = asyncHandler(async (req, res) => {
  const rec = await nonWorkerIdService.rejectRequest(req.params.id, req.user, req.body.reason || '');
  res.status(200).json({ success: true, data: rec });
});

exports.complete = asyncHandler(async (req, res) => {
  const rec = await nonWorkerIdService.completeRequest(req.params.id, req.user);
  res.status(200).json({ success: true, data: rec });
});
