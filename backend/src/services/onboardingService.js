const ApiError = require('../utils/apiError');
const JoiningForm = require('../models/JoiningForm');
const Referral = require('../models/Referral');
const auditService = require('./auditService');
const workflowService = require('./workflowService');
const emailService = require('./emailService');
const { WORKFLOW_STAGES } = require('../constants/workflowStages');
const { ROLES } = require('../constants/roles');

const buildAttachments = (files) => {
  if (!files || !Array.isArray(files)) return [];
  return files.map((file) => ({
    filename: file.filename,
    originalName: file.originalname,
    path: `/uploads/onboarding/${file.filename}`,
    mimeType: file.mimetype,
    uploadedAt: new Date(),
    type: 'attachment',
  }));
};

const hasObjectValue = (value) => {
  if (!value || typeof value !== 'object') return false;
  return Object.values(value).some((field) => field !== undefined && field !== null && field !== '');
};

// shallow+deep merge for plain objects and arrays (arrays replaced unless provided)
const deepMerge = (target, source) => {
  if (!source) return target;
  if (!target || typeof target !== 'object') return source;

  const result = Array.isArray(target) ? target.slice() : { ...target };

  Object.keys(source).forEach((key) => {
    const sVal = source[key];
    const tVal = result[key];

    if (Array.isArray(sVal)) {
      // replace arrays only when provided (to support partial updates)
      result[key] = sVal.slice();
      return;
    }

    if (sVal && typeof sVal === 'object') {
      result[key] = deepMerge(tVal && typeof tVal === 'object' ? tVal : {}, sVal);
      return;
    }

    // primitive
    result[key] = sVal;
  });

  return result;
};

const calculateCompletionPercentage = (payload = {}) => {
  const sections = [
    hasObjectValue(payload.personalDetails),
    hasObjectValue(payload.emergencyContact),
    hasObjectValue(payload.permanentAddress),
    hasObjectValue(payload.currentAddress),
    Array.isArray(payload.govtIds) && payload.govtIds.length > 0,
    Array.isArray(payload.educationDetails) && payload.educationDetails.length > 0,
    hasObjectValue(payload.declarations),
    Array.isArray(payload.attachments) && payload.attachments.length > 0,
  ];

  const completedCount = sections.filter(Boolean).length;
  return Math.min(100, Math.round((completedCount / sections.length) * 100));
};

const canAccessForm = (form, user) => {
  if (!form) return false;
  if (user.role === ROLES.CANDIDATE) {
    return form.candidateId.toString() === user.id.toString();
  }
  return true;
};

const safeReferralTransition = async (form, nextStage, actor, note) => {
  if (!form.referralId) return null;
  const referral = await Referral.findById(form.referralId);
  if (!referral) return null;
  if (workflowService.validateTransition(referral.workflowStage, nextStage)) {
    return workflowService.transitionReferralStage(referral, nextStage, actor, note);
  }
  return null;
};

const createJoiningFormDraft = async (payload, user, files = []) => {
  // Build base form and deep-merge nested fields to prevent empty defaults overwriting provided data
  const base = {
    referralId: payload.referralId,
    candidateId: payload.candidateId || user.id,
    candidateEmail: payload.candidateEmail || user.email,
    candidateName: payload.candidateName || user.name,
    personalDetails: {},
    emergencyContact: {},
    permanentAddress: {},
    currentAddress: {},
    govtIds: [],
    educationDetails: [],
    declarations: {},
    attachments: [],
    status: payload.status || 'DRAFT',
    workflowStage: payload.workflowStage || WORKFLOW_STAGES.JOINING_FORM_PENDING,
    completionPercentage: 0,
    createdBy: user.id,
    updatedBy: user.id,
  };

  // merge nested objects/arrays carefully
  base.personalDetails = deepMerge(base.personalDetails, payload.personalDetails || {});
  base.emergencyContact = deepMerge(base.emergencyContact, payload.emergencyContact || {});
  base.permanentAddress = deepMerge(base.permanentAddress, payload.permanentAddress || {});
  base.currentAddress = deepMerge(base.currentAddress, payload.currentAddress || {});
  base.govtIds = Array.isArray(payload.govtIds) ? payload.govtIds.slice() : base.govtIds;
  base.educationDetails = Array.isArray(payload.educationDetails) ? payload.educationDetails.slice() : base.educationDetails;
  base.declarations = deepMerge(base.declarations, payload.declarations || {});

  base.attachments = base.attachments.concat(buildAttachments(files));

  base.completionPercentage = calculateCompletionPercentage(base);

  const form = new JoiningForm(base);
  await form.save();

  await auditService.createAuditLog({
    action: 'CREATE_DRAFT',
    resourceType: 'JoiningForm',
    resourceId: form._id,
    performedBy: user.name,
    performedById: user.id,
    details: { status: form.status, referralId: String(form.referralId || '' ) },
  });

  try {
    if (form.candidateEmail) {
      await emailService.enqueueEmail(form.candidateEmail, 'onboardingUpdate', {
        name: form.candidateName,
        status: 'DRAFT',
        completionPercentage: form.completionPercentage,
      });
    }
  } catch (err) {
    console.error('Failed to send onboarding draft email', err.message || err);
  }

  return form;
};

const getJoiningFormById = async (id, user) => {
  const form = await JoiningForm.findById(id);
  if (!form) {
    throw new ApiError(404, 'Joining form not found');
  }

  if (!canAccessForm(form, user)) {
    throw new ApiError(403, 'Forbidden');
  }

  return form;
};

const updateJoiningForm = async (id, payload, user, files = []) => {
  const form = await JoiningForm.findById(id);
  if (!form) {
    throw new ApiError(404, 'Joining form not found');
  }

  if (form.status === 'HR_APPROVED') {
    throw new ApiError(403, 'Cannot edit a form that has already been approved by HR');
  }

  if (user.role === ROLES.CANDIDATE && form.candidateId.toString() !== user.id.toString()) {
    throw new ApiError(403, 'Forbidden');
  }

  const updatableFields = [
    'candidateName',
    'candidateEmail',
    'personalDetails',
    'emergencyContact',
    'permanentAddress',
    'currentAddress',
    'govtIds',
    'educationDetails',
    'declarations',
  ];

  updatableFields.forEach((field) => {
    if (payload[field] !== undefined) {
      // deep-merge nested objects
      if (['personalDetails', 'emergencyContact', 'permanentAddress', 'currentAddress', 'declarations'].includes(field)) {
        form[field] = deepMerge(form[field] && typeof form[field] === 'object' ? form[field].toObject ? form[field].toObject() : form[field] : {}, payload[field] || {});
        return;
      }

      // arrays: replace only if provided and is array
      if (['govtIds', 'educationDetails'].includes(field)) {
        if (Array.isArray(payload[field])) {
          form[field] = payload[field].slice();
        }
        return;
      }

      // primitives
      form[field] = payload[field];
    }
  });

  if (files && files.length > 0) {
    form.attachments = form.attachments.concat(buildAttachments(files));
  }

  form.completionPercentage = calculateCompletionPercentage(form.toObject ? form.toObject() : form);
  form.updatedBy = user.id;
  await form.save();

  await auditService.createAuditLog({
    action: 'UPDATE_DRAFT',
    resourceType: 'JoiningForm',
    resourceId: form._id,
    performedBy: user.name,
    performedById: user.id,
    details: { status: form.status },
  });

  return form;
};

const submitJoiningForm = async (id, user, submissionValidator) => {
  const form = await JoiningForm.findById(id);
  if (!form) {
    throw new ApiError(404, 'Joining form not found');
  }

  if (form.status === 'HR_APPROVED') {
    throw new ApiError(400, 'Joining form is already approved and cannot be resubmitted');
  }

  if (user.role === ROLES.CANDIDATE && form.candidateId.toString() !== user.id.toString()) {
    throw new ApiError(403, 'Forbidden');
  }

  const errors = submissionValidator(form.toObject());
  if (errors.length) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  form.status = 'SUBMITTED';
  form.submittedAt = new Date();
  form.updatedBy = user.id;
  form.workflowStage = WORKFLOW_STAGES.JOINING_FORM_PENDING;
  form.completionPercentage = calculateCompletionPercentage(form);

  await form.save();
  await safeReferralTransition(form, WORKFLOW_STAGES.JOINING_FORM_PENDING, { name: user.name, id: user.id }, 'Joining form submitted');

  await auditService.createAuditLog({
    action: 'SUBMIT_FORM',
    resourceType: 'JoiningForm',
    resourceId: form._id,
    performedBy: user.name,
    performedById: user.id,
    details: { status: form.status, submittedAt: form.submittedAt },
  });

  try {
    if (form.candidateEmail) {
      await emailService.enqueueEmail(form.candidateEmail, 'onboardingUpdate', {
        name: form.candidateName,
        status: 'SUBMITTED',
        completionPercentage: form.completionPercentage,
      });
    }
  } catch (err) {
    console.error('Failed to send onboarding submitted email', err.message || err);
  }

  return form;
};

const approveJoiningForm = async (id, user, approvalComment = '') => {
  const form = await JoiningForm.findById(id);
  if (!form) {
    throw new ApiError(404, 'Joining form not found');
  }

  if (form.status !== 'SUBMITTED') {
    throw new ApiError(400, 'Only submitted forms can be approved');
  }

  form.status = 'HR_APPROVED';
  form.approval = {
    approved: true,
    approvedBy: user.name,
    approvedById: user.id,
    approvedAt: new Date(),
    comment: approvalComment,
  };
  form.finalizedAt = new Date();
  form.updatedBy = user.id;
  form.completionPercentage = calculateCompletionPercentage(form);

  await form.save();
  await safeReferralTransition(form, WORKFLOW_STAGES.NDA_PENDING, { name: user.name, id: user.id }, 'Joining form approved by HR');

  await auditService.createAuditLog({
    action: 'APPROVE_FORM',
    resourceType: 'JoiningForm',
    resourceId: form._id,
    performedBy: user.name,
    performedById: user.id,
    details: { approved: true, comment: approvalComment },
  });

  try {
    if (form.candidateEmail) {
      await emailService.enqueueEmail(form.candidateEmail, 'onboardingUpdate', {
        name: form.candidateName,
        status: 'HR_APPROVED',
        approvedBy: user.name,
      });
    }
  } catch (err) {
    console.error('Failed to send onboarding approved email', err.message || err);
  }

  // trigger non-worker ID workflow creation
  try {
    const nonWorkerService = require('./nonWorkerIdService');
    await nonWorkerService.createRequest({ referralId: form.referralId, candidateId: form.candidateId, candidateName: form.candidateName, candidateEmail: form.candidateEmail }, user);
  } catch (err) {
    console.error('Failed to create NonWorkerId after onboarding approval', err.message || err);
  }

  return form;
};

const deleteJoiningFormDraft = async (id, user) => {
  const form = await JoiningForm.findById(id);
  if (!form) {
    throw new ApiError(404, 'Joining form not found');
  }

  if (form.status !== 'DRAFT') {
    throw new ApiError(400, 'Only draft onboarding forms can be deleted');
  }

  if (user.role === ROLES.CANDIDATE && form.candidateId.toString() !== user.id.toString()) {
    throw new ApiError(403, 'Forbidden');
  }

  await form.deleteOne();

  await auditService.createAuditLog({
    action: 'DELETE_DRAFT',
    resourceType: 'JoiningForm',
    resourceId: form._id,
    performedBy: user.name,
    performedById: user.id,
    details: { status: form.status },
  });

  return { id };
};

module.exports = {
  createJoiningFormDraft,
  getJoiningFormById,
  updateJoiningForm,
  submitJoiningForm,
  approveJoiningForm,
  deleteJoiningFormDraft,
};
