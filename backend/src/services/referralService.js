const ApiError = require('../utils/apiError');
const Referral = require('../models/Referral');
const auditService = require('../services/auditService');
const workflowService = require('../services/workflowService');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');

const createReferral = async (data, actor = {}) => {
  const referralData = { ...data };
  if (referralData.workflowStage && !workflowService.isValidStage(referralData.workflowStage)) {
    throw new ApiError(400, 'Invalid workflow stage');
  }

  const referral = await Referral.create(referralData);

  await workflowService.transitionReferralStage(
    referral,
    referral.workflowStage || workflowService.WORKFLOW_STAGES.REFERRED,
    actor,
    'Initial workflow stage',
    referralData.slaDeadline,
  );

  await auditService.createAuditLog({
    action: 'CREATE',
    resourceType: 'Referral',
    resourceId: referral._id,
    performedBy: actor.name,
    performedById: actor.id,
    details: { data: referralData },
  });

  if (referral.candidateEmail) {
    console.log(`Enqueuing referral received email to ${referral.candidateEmail} for referral ${referral._id}`);
    emailService.enqueueEmail(
      referral.candidateEmail,
      'referralReceived',
      {
        name: referral.candidateName,
        referralId: referral._id.toString(),
      },
    ).catch((err) => {
      console.error('Failed to enqueue referral received email:', err?.message || err);
    });
  }

  if (referral.candidateEmail) {
    console.log(`Sending referral received email to ${referral.candidateEmail}`);

    emailService
      .sendTemplate(
        referral.candidateEmail,
        'referralReceived',
        {
          name: referral.candidateName,
          referralId: referral._id.toString(),
        },
        { enqueue: false },
      )
      .catch((err) => {
        console.error('Failed to send referral email:', err?.message || err);
      });
  }

  try {
    await notificationService.createNotification({
      user: referral.referrer || actor.id,
      title: 'Referral submitted',
      message: `Referral for ${referral.candidateName} has been created and entered into workflow stage ${referral.workflowStage}.`,
      type: 'REFERRAL',
      workflowStage: referral.workflowStage,
      metadata: {
        referralId: referral._id,
        candidateName: referral.candidateName,
      },
      performedByName: actor.name || 'System',
      performedById: actor.id,
    });
  } catch (notificationError) {
    console.error('Failed to create referral notification:', notificationError?.message || notificationError);
  }

  return referral;
};

const getAllReferrals = async (filters = {}) => Referral.find(filters).sort({ createdAt: -1 });

const getReferralById = async (id) => Referral.findById(id);

const updateReferral = async (id, data, actor = {}) => {
  const referral = await Referral.findById(id);
  if (!referral) {
    return null;
  }

  const nextStage = data.workflowStage;
  if (nextStage && nextStage !== referral.workflowStage) {
    await workflowService.transitionReferralStage(referral, nextStage, actor, data.workflowNote || 'Workflow stage updated', data.slaDeadline);
  }

  referral.set({
    candidateName: data.candidateName ?? referral.candidateName,
    candidateEmail: data.candidateEmail ?? referral.candidateEmail,
    candidatePhone: data.candidatePhone ?? referral.candidatePhone,
    skills: data.skills ?? referral.skills,
    education: data.education ?? referral.education,
    mentor: data.mentor ?? referral.mentor,
    referrer: data.referrer ?? referral.referrer,
    status: data.status ?? referral.status,
    internshipDuration: data.internshipDuration ?? referral.internshipDuration,
    projectOverview: data.projectOverview ?? referral.projectOverview,
    location: data.location ?? referral.location,
  });

  const updatedReferral = await referral.save();

  await auditService.createAuditLog({
    action: 'UPDATE',
    resourceType: 'Referral',
    resourceId: updatedReferral._id,
    performedBy: actor.name,
    performedById: actor.id,
    details: { changes: data },
  });

  return updatedReferral;
};

const deleteReferral = async (id, actor = {}) => {
  const referral = await Referral.findByIdAndDelete(id);
  if (!referral) {
    return null;
  }

  await auditService.createAuditLog({
    action: 'DELETE',
    resourceType: 'Referral',
    resourceId: referral._id,
    performedBy: actor.name,
    performedById: actor.id,
    details: { data: referral },
  });

  return referral;
};

module.exports = {
  createReferral,
  getAllReferrals,
  getReferralById,
  updateReferral,
  deleteReferral,
};
