const ApiError = require('../utils/apiError');
const Referral = require('../models/Referral');
const auditService = require('../services/auditService');
const workflowService = require('../services/workflowService');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const onboardingService = require('../services/onboardingService');
const onboardingInviteService = require('../services/onboardingInviteService');
const aiScoringService = require('../services/aiScoringService');
const fs = require('fs').promises;
const path = require('path');
const { createOfferLetterPdf } = require('../utils/pdfGenerator');
const config = require('../config/environment');

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
    emailService.enqueueEmail(
      referral.candidateEmail,
      'referralReceived',
      { name: referral.candidateName, referralId: referral._id.toString() },
    ).catch((err) => {
      console.error('Failed to enqueue referral received email:', err?.message || err);
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

  // Trigger AI scoring asynchronously (don't block referral creation)
  if (referral.resume) {
    processAIScoring(referral._id, referral.resume, referral.skills || []).catch((err) => {
      console.error('AI scoring failed for referral:', referral._id, err?.message || err);
    });
  }

  return referral;
};

const getAllReferrals = async (filters = {}) => Referral.find(filters).sort({ createdAt: -1 });

const getReferralById = async (id) => Referral.findById(id);

const buildCandidateRole = (referral) => {
  const overview = `${referral.projectOverview || ''} ${referral.education || ''}`.toLowerCase();
  if (overview.includes('design')) return 'Design Intern';
  if (overview.includes('data')) return 'Data Intern';
  if (overview.includes('marketing')) return 'Marketing Intern';
  return 'Intern';
};

const getReferralDepartment = (referral) => referral.location || 'General';

const getMentorName = async (referral) => {
  if (!referral.mentor) return 'To be assigned';
  const User = require('../models/User');
  const mentor = await User.findById(referral.mentor).select('name');
  return mentor?.name || 'To be assigned';
};

const createOnboardingAndOffer = async (referral, actor) => {
  const onboarding = await onboardingService.createJoiningFormDraft(
    {
      referralId: referral._id,
      candidateId: referral.candidateId || referral._id,
      candidateEmail: referral.candidateEmail,
      candidateName: referral.candidateName,
      status: 'DRAFT',
      workflowStage: 'ONBOARDING_PENDING',
      personalDetails: {
        firstName: referral.candidateName?.split(' ')[0] || referral.candidateName,
        email: referral.candidateEmail,
        phone: referral.candidatePhone,
      },
    },
    { id: actor.id, email: actor.email, name: actor.name, role: actor.role },
    []
  );

  const mentorName = await getMentorName(referral);
  const offerLetterData = {
    candidateName: referral.candidateName,
    candidateEmail: referral.candidateEmail,
    role: buildCandidateRole(referral),
    department: getReferralDepartment(referral),
    mentor: mentorName,
    mentorEmail: '',
    duration: referral.internshipDuration || 'TBD',
    joiningDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    stipend: '',
    location: referral.location || 'Remote',
    referenceId: `RF-${String(referral._id).slice(-8).toUpperCase()}`,
    issuedByName: actor.name || 'Intern Flow HR Team',
  };

  const offerLetterPath = await createOfferLetterPdf(offerLetterData);
  const resolvedOfferLetterPath = path.resolve(path.join(__dirname, '..', offerLetterPath));

  if (referral.candidateEmail) {
    await emailService.enqueueEmail(
      referral.candidateEmail,
      'onboardingInitiation',
      {
        name: referral.candidateName,
        candidateName: referral.candidateName,
        role: offerLetterData.role,
        department: offerLetterData.department,
        mentor: offerLetterData.mentor,
        joiningDate: offerLetterData.joiningDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        onboardingPortalLink: config.getOnboardingPortalUrl(),
        hrContactEmail: config.hrContact.email,
        offerLetterAttached: true,
      },
      {
        attachments: [
          {
            filename: `Intern-Flow-Offer-Letter-${offerLetterData.referenceId}.pdf`,
            path: resolvedOfferLetterPath,
            contentType: 'application/pdf',
          },
        ],
      }
    );
  }

  await auditService.createAuditLog({
    action: 'ONBOARDING_CREATED',
    resourceType: 'Referral',
    resourceId: referral._id,
    performedBy: actor.name,
    performedById: actor.id,
    details: { onboardingId: onboarding?._id, offerLetterPath, candidateName: referral.candidateName },
  });

  return { onboarding, offerLetterPath };
};

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

const approveReferral = async (id, actor = {}, comment = '') => {
  const referral = await Referral.findById(id);
  if (!referral) {
    throw new ApiError(404, 'Referral not found');
  }

  if (referral.workflowStage !== workflowService.WORKFLOW_STAGES.HR_REVIEW_PENDING) {
    throw new ApiError(400, 'Referral is not ready for HR approval');
  }

  console.log(`[HR Approval] clicked by ${actor.email || actor.name || 'system'} for referral ${id}`);

  // Transition to HR_APPROVED
  await workflowService.transitionReferralStage(
    referral,
    workflowService.WORKFLOW_STAGES.HR_APPROVED,
    actor,
    comment || 'HR approved referral'
  );

  // Transition to ONBOARDING_PENDING
  await workflowService.transitionReferralStage(
    referral,
    workflowService.WORKFLOW_STAGES.ONBOARDING_PENDING,
    actor,
    'Onboarding created after HR approval'
  );

  referral.status = 'APPROVED';
  await referral.save();

  // Create onboarding record and offer letter
  const { onboarding, offerLetterPath } = await createOnboardingAndOffer(referral, actor);

  // Create onboarding invitation
  console.log('[HR Approval] Creating onboarding invitation for', referral.candidateEmail);
  let invite = null;
  let activationLink = '';

  try {
    invite = await onboardingInviteService.createOnboardingInvite({
      email: referral.candidateEmail,
      referralId: referral._id,
      onboardingId: onboarding._id,
      createdBy: actor.id,
      role: 'CANDIDATE',
      expiryHours: 72, // 3 days
    });

    // Transition to ONBOARDING_INVITED
    await workflowService.transitionReferralStage(
      referral,
      workflowService.WORKFLOW_STAGES.ONBOARDING_INVITED,
      actor,
      'Onboarding invitation sent to candidate'
    );

    // Generate activation link using config helper
    activationLink = config.getActivationUrl(invite.token);

    console.log('[HR Approval] Invitation created, sending email with activation link');
    console.log('[HR Approval] Activation link:', activationLink);

    // Send onboarding invitation email with offer letter
    const mentorName = await getMentorName(referral);

    // Resolve offer letter path for attachment
    const resolvedOfferLetterPath = offerLetterPath
      ? path.resolve(path.join(__dirname, '..', offerLetterPath))
      : null;

    await emailService.enqueueEmail(
      referral.candidateEmail,
      'onboardingInvitation',
      {
        candidateName: referral.candidateName,
        department: getReferralDepartment(referral),
        role: 'CANDIDATE',
        internshipDuration: referral.internshipDuration || 'TBD',
        mentor: mentorName,
        startDate: onboarding.startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        activationLink,
        offerLetterAttached: !!offerLetterPath,
      },
      resolvedOfferLetterPath ? [resolvedOfferLetterPath] : []
    );

    console.log('[HR Approval] Onboarding invitation email queued successfully');
  } catch (inviteErr) {
    console.error('[HR Approval] Failed to create invitation or send email:', inviteErr?.message || inviteErr);
    // Don't fail the entire approval if invitation fails
  }

  // Always log activation link for local development/testing
  if (activationLink) {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  🚀 ACTIVATION LINK (Copy-paste to browser)                   ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║  ', activationLink.padEnd(58), '║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║  Candidate:', referral.candidateEmail.padEnd(47), '║');
    console.log('║  Expires: 72 hours from approval                               ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
  }

  // Create audit log
  await auditService.createAuditLog({
    action: 'APPROVE_REFERRAL',
    resourceType: 'Referral',
    resourceId: referral._id,
    performedBy: actor.name,
    performedById: actor.id,
    details: {
      comment,
      candidateName: referral.candidateName,
      onboardingId: onboarding?._id,
      offerLetterPath,
      inviteId: invite?._id,
      activationLink,
    },
  });

  // Send internal notification
  try {
    await notificationService.createNotification({
      user: referral.referrer || actor.id,
      title: 'Referral approved',
      message: `${referral.candidateName} was approved and invitation sent.`,
      type: 'WORKFLOW',
      workflowStage: workflowService.WORKFLOW_STAGES.ONBOARDING_INVITED,
      metadata: {
        referralId: referral._id,
        onboardingId: onboarding?._id,
        offerLetterPath,
        inviteId: invite?._id,
      },
      performedByName: actor.name || 'System',
      performedById: actor.id,
    });
  } catch (err) {
    console.error('[HR Approval] notification failed:', err?.message || err);
  }

  return { referral, onboarding, offerLetterPath, invite, activationLink };
};

const rejectReferral = async (id, actor = {}, reason = '') => {
  const referral = await Referral.findById(id);
  if (!referral) {
    throw new ApiError(404, 'Referral not found');
  }

  if (referral.workflowStage !== workflowService.WORKFLOW_STAGES.HR_REVIEW_PENDING) {
    throw new ApiError(400, 'Referral is not ready for HR rejection');
  }

  console.log(`[HR Rejection] clicked by ${actor.email || actor.name || 'system'} for referral ${id}`);

  await workflowService.transitionReferralStage(
    referral,
    workflowService.WORKFLOW_STAGES.HR_REJECTED,
    actor,
    reason || 'HR rejected referral'
  );

  referral.status = 'REJECTED';
  await referral.save();

  await auditService.createAuditLog({
    action: 'REJECT_REFERRAL',
    resourceType: 'Referral',
    resourceId: referral._id,
    performedBy: actor.name,
    performedById: actor.id,
    details: { reason: reason || 'No reason provided', candidateName: referral.candidateName },
  });

  try {
    if (referral.candidateEmail) {
      await emailService.enqueueEmail(referral.candidateEmail, 'referralReceived', {
        name: referral.candidateName,
        candidateName: referral.candidateName,
        reason: reason || 'Your referral was not selected at this stage.',
      });
    }
  } catch (err) {
    console.error('[HR Rejection] email queue failed:', err?.message || err);
  }

  return { referral };
};

const processAIScoring = async (referralId, resumePath, candidateSkills = []) => {
  try {
    const referral = await Referral.findById(referralId);
    if (!referral) {
      console.error('[AI Scoring] Referral not found:', referralId);
      return;
    }

    console.log(`[AI Scoring] Starting AI evaluation for referral ${referralId}`);

    // Transition to AI_PROCESSING stage
    await workflowService.transitionReferralStage(
      referral,
      workflowService.WORKFLOW_STAGES.AI_PROCESSING,
      { name: 'AI System', id: null, role: 'system' },
      'AI resume evaluation in progress'
    );

    // Read resume text
    let resumeText = '';
    try {
      const path = require('path');
      const fullPath = path.resolve(path.join(__dirname, '..', resumePath));
      const ext = path.extname(resumePath).toLowerCase();

      console.log(`[AI Scoring] Reading resume file: ${fullPath}`);

      if (ext === '.pdf') {
        try {
          const { PDFParse } = require('pdf-parse');
          const buffer = await fs.readFile(fullPath);
          const parser = new PDFParse({ data: buffer });
          const data = await parser.getText();
          resumeText = data.text || '';
          console.log(`[AI Scoring] Extracted ${resumeText.length} characters from PDF`);
        } catch (pdfErr) {
          console.error('[AI Scoring] PDF extraction failed:', pdfErr.message);
          resumeText = `Candidate with skills: ${candidateSkills.join(', ')}. Education and experience details available.`;
        }
      } else if (ext === '.docx') {
        try {
          const mammoth = require('mammoth');
          const result = await mammoth.extractRawText({ path: fullPath });
          resumeText = result.value || '';
          console.log(`[AI Scoring] Extracted ${resumeText.length} characters from DOCX`);
        } catch (docxErr) {
          console.error('[AI Scoring] DOCX extraction failed:', docxErr.message);
          resumeText = `Candidate with skills: ${candidateSkills.join(', ')}. Education and experience details available.`;
        }
      } else {
        // Try reading as text
        try {
          resumeText = await fs.readFile(fullPath, 'utf-8');
          console.log(`[AI Scoring] Read ${resumeText.length} characters as text`);
        } catch (readErr) {
          console.log('[AI Scoring] Could not read as text, using fallback');
          resumeText = `Candidate with skills: ${candidateSkills.join(', ')}. Education and experience details available.`;
        }
      }

      // Fallback if no text extracted
      if (!resumeText || resumeText.trim().length < 10) {
        console.warn('[AI Scoring] Insufficient resume text, using fallback');
        resumeText = `Candidate profile with listed skills: ${candidateSkills.join(', ')}. Additional education and experience information available for review.`;
      }
    } catch (err) {
      console.error('[AI Scoring] Failed to read resume file:', err.message);
      resumeText = `Candidate profile with skills: ${candidateSkills.join(', ')}. Education and experience details available for review.`;
    }

    // Score candidate
    const scoring = await aiScoringService.scoreCandidate(resumeText, candidateSkills);

    // Update referral with AI results
    referral.aiScore = scoring.score;
    referral.aiSummary = scoring.summary;
    referral.aiRecommendation = scoring.recommendation;
    referral.aiStrengths = scoring.strengths;
    referral.aiWeaknesses = scoring.weaknesses;
    referral.aiSkillsExtracted = scoring.skillsExtracted;
    referral.aiProcessedAt = new Date();
    await referral.save();

    console.log(`[AI Scoring] AI evaluation complete for referral ${referralId}: ${scoring.score}/100 (${scoring.recommendation})`);

    // Transition to HR_REVIEW_PENDING
    await workflowService.transitionReferralStage(
      referral,
      workflowService.WORKFLOW_STAGES.HR_REVIEW_PENDING,
      { name: 'AI System', id: null, role: 'system' },
      `AI evaluation complete - Score: ${scoring.score}/100, Recommendation: ${scoring.recommendation}`
    );

    // Notify HR
    try {
      const User = require('../models/User');
      const { ROLES } = require('../constants/roles');
      const hrUsers = await User.find({ role: ROLES.HR, isActive: { $ne: false } });

      console.log(`[AI Scoring] Found ${hrUsers.length} HR users to notify`);

      if (hrUsers.length === 0) {
        console.warn('[AI Scoring] No HR users found to notify about referral');
      }

      for (const hrUser of hrUsers) {
        try {
          await notificationService.createNotification({
            user: hrUser._id,
            title: 'New referral ready for review',
            message: `${referral.candidateName} - AI Score: ${scoring.score}/100 (${scoring.recommendation})`,
            type: 'HR_REVIEW',
            workflowStage: workflowService.WORKFLOW_STAGES.HR_REVIEW_PENDING,
            metadata: {
              referralId: referral._id,
              aiScore: scoring.score,
              aiRecommendation: scoring.recommendation,
            },
            performedByName: 'AI System',
            performedById: null,
          });

          console.log(`[AI Scoring] Notification created for HR user: ${hrUser.email}`);
        } catch (notifErr) {
          console.error(`[AI Scoring] Failed to create notification for ${hrUser.email}:`, notifErr.message);
        }

        // Send email notification to HR
        try {
          await emailService.enqueueEmail(
            hrUser.email,
            'referralReceived',
            {
              name: hrUser.name,
              candidateName: referral.candidateName,
              aiScore: scoring.score,
              recommendation: scoring.recommendation,
              referralId: referral._id.toString(),
            }
          );

          console.log(`[AI Scoring] Email queued for HR user: ${hrUser.email}`);
        } catch (emailErr) {
          console.error(`[AI Scoring] Failed to queue email for ${hrUser.email}:`, emailErr.message);
        }
      }
    } catch (notifyErr) {
      console.error('[AI Scoring] Failed to notify HR about new referral:', notifyErr.message);
    }

    await auditService.createAuditLog({
      action: 'AI_SCORING_COMPLETE',
      resourceType: 'Referral',
      resourceId: referral._id,
      performedBy: 'AI System',
      performedById: null,
      details: {
        score: scoring.score,
        recommendation: scoring.recommendation,
        summary: scoring.summary,
      },
    });

    console.log(`[AI Scoring] Successfully completed AI scoring for referral ${referralId}: ${scoring.score}/100`);
  } catch (error) {
    console.error('[AI Scoring] AI scoring process failed:', error.message || error);
    console.error('[AI Scoring] Error stack:', error.stack);

    // On failure, still transition to HR review but without AI data
    try {
      const referral = await Referral.findById(referralId);
      if (referral) {
        console.log(`[AI Scoring] Transitioning to HR_REVIEW_PENDING after failure`);
        await workflowService.transitionReferralStage(
          referral,
          workflowService.WORKFLOW_STAGES.HR_REVIEW_PENDING,
          { name: 'AI System', id: null, role: 'system' },
          'AI evaluation failed - manual review required'
        );

        // Still try to notify HR even if AI failed
        try {
          const User = require('../models/User');
          const { ROLES } = require('../constants/roles');
          const hrUsers = await User.find({ role: ROLES.HR, isActive: { $ne: false } });

          for (const hrUser of hrUsers) {
            await notificationService.createNotification({
              user: hrUser._id,
              title: 'New referral requires manual review',
              message: `${referral.candidateName} - AI scoring failed, manual review required`,
              type: 'HR_REVIEW',
              workflowStage: workflowService.WORKFLOW_STAGES.HR_REVIEW_PENDING,
              metadata: {
                referralId: referral._id,
                aiStatus: 'FAILED',
              },
              performedByName: 'System',
              performedById: null,
            });
          }
        } catch (notifyErr) {
          console.error('[AI Scoring] Failed to notify HR after AI failure:', notifyErr.message);
        }
      }
    } catch (transitionErr) {
      console.error('[AI Scoring] Failed to transition after AI scoring failure:', transitionErr.message);
    }
  }
};

module.exports = {
  createReferral,
  getAllReferrals,
  getReferralById,
  updateReferral,
  deleteReferral,
  approveReferral,
  rejectReferral,
  processAIScoring,
};
