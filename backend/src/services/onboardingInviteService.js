const crypto = require('crypto');
const OnboardingInvite = require('../models/OnboardingInvite');
const Referral = require('../models/Referral');
const JoiningForm = require('../models/JoiningForm');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const auditService = require('./auditService');
const { WORKFLOW_STAGES } = require('../constants/workflowStages');
const { ROLES } = require('../constants/roles');

/**
 * Generate secure random token
 */
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create onboarding invitation
 */
async function createOnboardingInvite({ email, referralId, onboardingId, createdBy, role = 'CANDIDATE', expiryHours = 72 }) {
  console.log('[OnboardingInvite] Creating invite for', email, 'referral:', referralId);

  // Check if active invite already exists
  const existingInvite = await OnboardingInvite.findOne({
    email,
    referralId,
    accepted: false,
    expiresAt: { $gt: new Date() },
  });

  if (existingInvite) {
    console.log('[OnboardingInvite] Active invite already exists:', existingInvite._id);
    return existingInvite;
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.log('[OnboardingInvite] User already exists for email:', email);
    throw new ApiError(400, 'User account already exists for this email');
  }

  // Generate secure token
  const token = generateSecureToken();

  // Calculate expiration
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiryHours);

  // Create invite
  const invite = await OnboardingInvite.create({
    email,
    referralId,
    onboardingId,
    token,
    role,
    expiresAt,
    createdBy,
    metadata: {
      sentAt: new Date(),
    },
  });

  console.log('[OnboardingInvite] Invite created:', invite._id, 'token:', token.substring(0, 8) + '...');

  // Create audit log
  await auditService.createAuditLog({
    userId: createdBy,
    action: 'ONBOARDING_INVITE_CREATED',
    resourceType: 'OnboardingInvite',
    resourceId: invite._id,
    details: {
      email,
      referralId,
      expiresAt,
    },
  });

  // Note: Workflow history is created by referralService when transitioning to ONBOARDING_INVITED stage

  return invite;
}

/**
 * Validate invitation token
 */
async function validateInviteToken(token) {
  console.log('[OnboardingInvite] Validating token:', token.substring(0, 8) + '...');

  if (!token) {
    throw new ApiError(400, 'Invitation token is required');
  }

  const invite = await OnboardingInvite.findOne({ token })
    .populate('referralId')
    .populate('onboardingId');

  if (!invite) {
    console.log('[OnboardingInvite] Token not found');
    throw new ApiError(404, 'Invalid invitation token');
  }

  if (invite.accepted) {
    console.log('[OnboardingInvite] Token already accepted');
    throw new ApiError(400, 'This invitation has already been accepted');
  }

  if (new Date() > invite.expiresAt) {
    console.log('[OnboardingInvite] Token expired');
    throw new ApiError(400, 'This invitation has expired');
  }

  console.log('[OnboardingInvite] Token valid for:', invite.email);

  return {
    invite,
    referral: invite.referralId,
    onboarding: invite.onboardingId,
  };
}

/**
 * Accept invitation and create user account
 */
async function acceptInvite({ token, password, additionalData = {} }) {
  console.log('[OnboardingInvite] Accepting invite with token:', token.substring(0, 8) + '...');

  // Validate token
  const { invite, referral, onboarding } = await validateInviteToken(token);

  // Check if user already exists (double-check)
  const existingUser = await User.findOne({ email: invite.email });
  if (existingUser) {
    console.log('[OnboardingInvite] User already exists, cannot accept invite');
    throw new ApiError(400, 'User account already exists for this email');
  }

  // Create user account linked to referral
  // Convert invite role (uppercase) to User role (lowercase)
  const userRole = invite.role === 'CANDIDATE' ? ROLES.CANDIDATE :
                   invite.role === 'EMPLOYEE' ? 'employee' :
                   ROLES.CANDIDATE; // Default to candidate

  const user = await User.create({
    name: referral.candidateName || referral.name,
    email: invite.email,
    password, // Will be hashed by User model pre-save hook
    role: userRole,
    department: referral.department,
    phone: referral.candidatePhone || referral.phone,
    location: referral.location,
    metadata: {
      referralId: referral._id,
      onboardingId: onboarding._id,
      inviteId: invite._id,
      source: 'ONBOARDING_INVITE',
      ...additionalData,
    },
  });

  console.log('[OnboardingInvite] User created:', user._id, user.email);

  // Mark invite as accepted
  await invite.markAccepted(user._id);

  // Update onboarding with candidateId
  onboarding.candidateId = user._id;
  onboarding.status = 'DRAFT'; // Valid values: DRAFT, SUBMITTED, HR_APPROVED
  onboarding.metadata = {
    ...onboarding.metadata,
    accountActivatedAt: new Date(),
    inviteAcceptedAt: new Date(),
  };
  await onboarding.save();

  console.log('[OnboardingInvite] Onboarding updated with candidateId:', user._id);

  // Update referral workflow stage
  referral.workflowStage = WORKFLOW_STAGES.JOINING_FORM_PENDING;
  referral.metadata = {
    ...referral.metadata,
    candidateId: user._id,
    accountActivatedAt: new Date(),
  };
  await referral.save();

  console.log('[OnboardingInvite] Referral updated to JOINING_FORM_PENDING');

  // Create audit log
  await auditService.createAuditLog({
    userId: user._id,
    action: 'ONBOARDING_INVITE_ACCEPTED',
    resourceType: 'OnboardingInvite',
    resourceId: invite._id,
    details: {
      email: invite.email,
      referralId: referral._id,
      onboardingId: onboarding._id,
    },
  });

  // Note: Workflow history is automatically tracked by the referral stage transition above

  return {
    user,
    invite,
    referral,
    onboarding,
  };
}

/**
 * Check if email has pending invite
 */
async function checkPendingInvite(email) {
  const invite = await OnboardingInvite.findOne({
    email: email.toLowerCase().trim(),
    accepted: false,
    expiresAt: { $gt: new Date() },
  });

  return invite ? true : false;
}

/**
 * Get invite by token (public view)
 */
async function getInviteByToken(token) {
  const { invite, referral, onboarding } = await validateInviteToken(token);

  // Return sanitized data (no sensitive info)
  return {
    email: invite.email,
    candidateName: referral.candidateName || referral.name,
    department: referral.department,
    role: invite.role,
    internshipDuration: referral.internshipDuration,
    location: referral.location,
    expiresAt: invite.expiresAt,
    onboarding: {
      mentor: onboarding.mentor,
      project: onboarding.project,
      startDate: onboarding.startDate,
    },
  };
}

module.exports = {
  createOnboardingInvite,
  validateInviteToken,
  acceptInvite,
  checkPendingInvite,
  getInviteByToken,
};
