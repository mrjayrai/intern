const trackingService = require('../services/trackingService');
const activityFeedService = require('../services/activityFeedService');
const ExtensionRequest = require('../models/ExtensionRequest');
const AuditService = require('../services/auditService');
const ApiError = require('../utils/apiError');
const { ROLES } = require('../constants/roles');

const getTrackingByCandidate = async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const user = req.user;

    // Ownership validation: candidates can only see their own data
    if (user.role === ROLES.CANDIDATE && user.id.toString() !== candidateId.toString()) {
      console.warn(`[Security] Unauthorized tracking access attempt by ${user.email} for candidate ${candidateId}`);
      throw new ApiError(403, 'Forbidden: Cannot access tracking data for other candidates');
    }

    // fetch history entries across referrals/onboarding for a candidate
    const feed = await activityFeedService.buildActivityFeed({ candidateId });
    res.json({ success: true, data: feed });
  } catch (err) {
    next(err);
  }
};

const getActivityFeed = async (req, res, next) => {
  try {
    const { limit, since } = req.query;
    const feed = await trackingService.getActivityFeed({ limit: parseInt(limit) || 200, since });
    res.json({ success: true, data: feed });
  } catch (err) {
    next(err);
  }
};

const getWorkflowHistory = async (req, res, next) => {
  try {
    const { referralId } = req.params;
    // Return structured timeline instead of raw history entries
    const timeline = await trackingService.buildWorkflowTimeline(referralId);
    if (!timeline) {
      throw new ApiError(404, 'Referral not found');
    }
    res.json({ success: true, data: timeline });
  } catch (err) {
    next(err);
  }
};

const createExtensionRequest = async (req, res, next) => {
  try {
    const { candidateId, reason, requestedDays } = req.body;
    const er = new ExtensionRequest({ candidateId, reason, requestedDays });
    const saved = await er.save();
    await AuditService.createAuditLog({ action: 'EXTENSION_REQUEST_CREATED', resourceType: 'ExtensionRequest', resourceId: saved._id, performedBy: req.user?.name || 'system', performedById: req.user?.id });
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
};

const approveExtensionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const approver = req.user;
    const er = await ExtensionRequest.findById(id);
    if (!er) return res.status(404).json({ success: false, message: 'Not found' });
    er.approvalStatus = 'APPROVED';
    er.approvedBy = approver?.id;
    er.comments = req.body.comments || er.comments;
    await er.save();
    await AuditService.createAuditLog({ action: 'EXTENSION_REQUEST_APPROVED', resourceType: 'ExtensionRequest', resourceId: er._id, performedBy: approver?.name || 'system', performedById: approver?.id });
    res.json({ success: true, data: er });
  } catch (err) {
    next(err);
  }
};

const rejectExtensionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const approver = req.user;
    const er = await ExtensionRequest.findById(id);
    if (!er) return res.status(404).json({ success: false, message: 'Not found' });
    er.approvalStatus = 'REJECTED';
    er.approvedBy = approver?.id;
    er.comments = req.body.comments || er.comments;
    await er.save();
    await AuditService.createAuditLog({ action: 'EXTENSION_REQUEST_REJECTED', resourceType: 'ExtensionRequest', resourceId: er._id, performedBy: approver?.name || 'system', performedById: approver?.id });
    res.json({ success: true, data: er });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTrackingByCandidate,
  getActivityFeed,
  getWorkflowHistory,
  createExtensionRequest,
  approveExtensionRequest,
  rejectExtensionRequest,
};
