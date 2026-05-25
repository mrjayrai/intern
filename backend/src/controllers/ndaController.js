const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const ndaService = require('../services/ndaService');
const { validateNdaCreate, validateNdaUpdate, validateNdaSign, validateNdaReject, validateNdaArchive, validateNdaAction } = require('../validators/ndaValidator');
const { ROLES } = require('../constants/roles');

const isCandidateOwner = (nda, user) => {
  if (!nda || !user || user.role !== ROLES.CANDIDATE) return false;
  return nda.candidateId?.toString() === user.id?.toString() || nda.candidateEmail === user.email;
};

exports.createNda = asyncHandler(async (req, res) => {
  const errors = validateNdaCreate(req.body);
  if (errors.length) throw new ApiError(400, 'Invalid payload', errors);

  const actor = req.user || {};
  const nda = await ndaService.createNda(req.body, req.file, actor);
  return res.status(201).json({ success: true, data: nda });
});

exports.listNdas = asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    workflowStage: req.query.workflowStage,
    candidateId: req.query.candidateId,
    candidateEmail: req.query.candidateEmail,
    referralId: req.query.referralId,
  };

  if (req.user.role === ROLES.CANDIDATE) {
    filters.candidateId = req.user.id;
    filters.candidateEmail = req.user.email;
    console.log(`[NDA] Candidate ${req.user.email} (ID: ${req.user.id}) listing their NDAs`);
  }

  const results = await ndaService.getAllNdas(filters, req.query);

  if (req.user.role === ROLES.CANDIDATE && results.data.length === 0) {
    console.log(`[NDA] No NDAs found for candidate ${req.user.email}. Filters used:`, { candidateId: filters.candidateId, candidateEmail: filters.candidateEmail });
  }

  return res.status(200).json({ success: true, data: results });
});

exports.getNda = asyncHandler(async (req, res) => {
  const nda = await ndaService.getNdaById(req.params.id);
  if (!nda) throw new ApiError(404, 'NDA not found');
  if (req.user.role === ROLES.CANDIDATE && !isCandidateOwner(nda, req.user)) {
    console.warn(`[Security] Unauthorized NDA access attempt by candidate ${req.user.email} (ID: ${req.user.id}) for NDA ${req.params.id}`);
    throw new ApiError(403, 'Forbidden: cannot access this NDA');
  }
  return res.status(200).json({ success: true, data: nda });
});

exports.updateNda = asyncHandler(async (req, res) => {
  const errors = validateNdaUpdate(req.body, req.params);
  if (errors.length) throw new ApiError(400, 'Invalid payload', errors);

  const actor = req.user || {};
  const nda = await ndaService.updateNda(req.params.id, req.body, req.file, actor);
  return res.status(200).json({ success: true, data: nda });
});

exports.deleteNda = asyncHandler(async (req, res) => {
  const nda = await ndaService.deleteNda(req.params.id, req.user || {});
  if (!nda) throw new ApiError(404, 'NDA not found');
  return res.status(200).json({ success: true, data: nda });
});

exports.signNda = asyncHandler(async (req, res) => {
  const errors = validateNdaSign(req.body, req.params);
  if (errors.length) throw new ApiError(400, 'Invalid payload', errors);

  const actor = req.user || {};
  const payload = {
    signatureName: req.body.signatureName,
    signatureAccepted: req.body.signatureAccepted,
    notes: req.body.notes,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };

  const nda = await ndaService.signNda(req.params.id, payload, actor);
  return res.status(200).json({ success: true, data: nda });
});

exports.approveNda = asyncHandler(async (req, res) => {
  const errors = validateNdaAction(req.body, req.params);
  if (errors.length) throw new ApiError(400, 'Invalid payload', errors);

  const actor = req.user || {};
  const nda = await ndaService.approveNda(req.params.id, { notes: req.body.notes }, actor);
  return res.status(200).json({ success: true, data: nda });
});

exports.rejectNda = asyncHandler(async (req, res) => {
  const errors = validateNdaReject(req.body, req.params);
  if (errors.length) throw new ApiError(400, 'Invalid payload', errors);

  const actor = req.user || {};
  const nda = await ndaService.rejectNda(req.params.id, { notes: req.body.notes }, actor);
  return res.status(200).json({ success: true, data: nda });
});

exports.archiveNda = asyncHandler(async (req, res) => {
  const errors = validateNdaArchive(req.body, req.params);
  if (errors.length) throw new ApiError(400, 'Invalid payload', errors);

  const actor = req.user || {};
  const nda = await ndaService.archiveNda(req.params.id, req.body.reason || '', actor);
  return res.status(200).json({ success: true, data: nda });
});
