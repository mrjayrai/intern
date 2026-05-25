const asyncHandler = require('../utils/asyncHandler');
const onboardingInviteService = require('../services/onboardingInviteService');
const ApiError = require('../utils/apiError');

/**
 * GET /api/onboarding-invites/validate/:token
 * Validate invitation token and return invite details
 */
exports.validateInviteToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  console.log('[OnboardingInvite API] Validating token:', token.substring(0, 8) + '...');

  const inviteData = await onboardingInviteService.getInviteByToken(token);

  res.status(200).json({
    success: true,
    data: inviteData,
    message: 'Invitation is valid',
  });
});

/**
 * POST /api/onboarding-invites/accept
 * Accept invitation and create user account
 */
exports.acceptInvite = asyncHandler(async (req, res) => {
  const { token, password, additionalData } = req.body;

  console.log('[OnboardingInvite API] Request body:', {
    hasToken: !!token,
    hasPassword: !!password,
    passwordLength: password?.length
  });

  if (!token) {
    console.error('[OnboardingInvite API] Error: Token missing');
    throw new ApiError(400, 'Invitation token is required');
  }

  if (!password) {
    console.error('[OnboardingInvite API] Error: Password missing');
    throw new ApiError(400, 'Password is required');
  }

  if (password.length < 6) {
    console.error('[OnboardingInvite API] Error: Password too short:', password.length);
    throw new ApiError(400, 'Password must be at least 6 characters long');
  }

  console.log('[OnboardingInvite API] Accepting invitation with token:', token.substring(0, 8) + '...');

  try {
    const result = await onboardingInviteService.acceptInvite({
      token,
      password,
      additionalData,
    });

    console.log('[OnboardingInvite API] Invitation accepted successfully');

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: result.user._id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          department: result.user.department,
        },
        referral: {
          id: result.referral._id,
          workflowStage: result.referral.workflowStage,
        },
        onboarding: {
          id: result.onboarding._id,
          status: result.onboarding.status,
        },
      },
      message: 'Account activated successfully. You can now log in.',
    });
  } catch (error) {
    console.error('[OnboardingInvite API] Error accepting invitation:', error.message);
    console.error('[OnboardingInvite API] Error stack:', error.stack);
    throw error;
  }
});

/**
 * POST /api/onboarding-invites/check-email
 * Check if email has pending invitation
 */
exports.checkPendingInvite = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  console.log('[OnboardingInvite API] Checking pending invite for:', email);

  const hasPendingInvite = await onboardingInviteService.checkPendingInvite(email);

  res.status(200).json({
    success: true,
    data: {
      hasPendingInvite,
      message: hasPendingInvite
        ? 'This email has a pending onboarding invitation. Please check your email.'
        : 'No pending invitation found.',
    },
  });
});
