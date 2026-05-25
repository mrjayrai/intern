const ApiError = require('../utils/apiError');
const Referral = require('../models/Referral');
const auditService = require('../services/auditService');
const workflowService = require('../services/workflowService');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const aiScoringService = require('../services/aiScoringService');
const fs = require('fs').promises;

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
  processAIScoring,
};
