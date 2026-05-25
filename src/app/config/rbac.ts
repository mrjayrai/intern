import type { UserRole } from '../lib/api';

// Route-level permissions — which roles can access which paths
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/': ['superAdmin', 'hr', 'mentor', 'referrer', 'it', 'compliance', 'employee'],
  '/referrals': ['superAdmin', 'hr', 'mentor', 'referrer'],
  '/candidates': ['superAdmin', 'hr', 'mentor'],
  '/onboarding': ['superAdmin', 'hr', 'candidate', 'employee'],
  '/onboarding-approvals': ['superAdmin', 'hr'],
  '/documents': ['superAdmin', 'hr', 'candidate', 'compliance', 'employee'],
  '/ids': ['superAdmin', 'hr', 'it'],
  '/access': ['superAdmin', 'it'],
  '/tracking': ['superAdmin', 'hr', 'mentor', 'it'],
  '/certificates': ['superAdmin', 'hr', 'candidate', 'employee'],
  '/reports': ['superAdmin', 'hr', 'compliance'],
  '/ai-assistant': ['superAdmin', 'hr', 'mentor', 'referrer', 'candidate', 'it', 'compliance', 'employee'],
  '/settings': ['superAdmin'],
};

// Sidebar nav visibility — which nav items appear for which roles
export const SIDEBAR_PERMISSIONS: Record<string, UserRole[]> = {
  '/': ['superAdmin', 'hr', 'mentor', 'referrer', 'it', 'compliance', 'employee'],
  '/referrals': ['superAdmin', 'hr', 'mentor', 'referrer'],
  '/onboarding': ['superAdmin', 'hr', 'candidate', 'employee'],
  '/onboarding-approvals': ['superAdmin', 'hr'],
  '/documents': ['superAdmin', 'hr', 'candidate', 'compliance', 'employee'],
  '/ids': ['superAdmin', 'hr', 'it'],
  '/access': ['superAdmin', 'it'],
  '/tracking': ['superAdmin', 'hr', 'mentor', 'it'],
  '/certificates': ['superAdmin', 'hr', 'candidate', 'employee'],
  '/reports': ['superAdmin', 'hr', 'compliance'],
  '/ai-assistant': ['superAdmin', 'hr', 'mentor', 'referrer', 'candidate', 'it', 'compliance', 'employee'],
  '/settings': ['superAdmin'],
};

// Action-level permissions
export const ACTION_PERMISSIONS = {
  // NDA actions
  ndaApproval: ['superAdmin', 'hr', 'compliance'] as UserRole[],
  signNDA: ['candidate', 'employee'] as UserRole[],
  // Referral actions
  approveReferral: ['hr', 'superAdmin'] as UserRole[],
  rejectReferral: ['hr', 'superAdmin'] as UserRole[],
  // Onboarding actions
  approveOnboarding: ['hr', 'superAdmin'] as UserRole[],
  // Access provisioning
  provisionAccess: ['it', 'superAdmin'] as UserRole[],
  manageAccess: ['superAdmin', 'it'] as UserRole[],
  // IDs
  approveIDs: ['superAdmin', 'hr', 'it'] as UserRole[],
  ids: ['superAdmin', 'it'] as UserRole[],
  // Reports
  viewReports: ['superAdmin', 'hr', 'compliance'] as UserRole[],
  reports: ['superAdmin', 'hr'] as UserRole[],
  // Candidates
  viewAssignedCandidates: ['mentor', 'superAdmin', 'hr'] as UserRole[],
  // Generic access
  access: ['superAdmin', 'it'] as UserRole[],
};

export function hasPermission(
  role: UserRole | undefined,
  action: keyof typeof ACTION_PERMISSIONS,
): boolean {
  if (!role) return false;
  return (ACTION_PERMISSIONS[action] as UserRole[]).includes(role);
}

export function canViewReports(role: UserRole | undefined): boolean {
  return hasPermission(role, 'viewReports');
}

export function canManageAccess(role: UserRole | undefined): boolean {
  return hasPermission(role, 'manageAccess');
}

export function canApproveNDA(role: UserRole | undefined): boolean {
  return hasPermission(role, 'ndaApproval');
}

export function canAccessRoute(role: UserRole | undefined, path: string): boolean {
  if (!role) return false;
  const allowed = ROUTE_PERMISSIONS[path];
  if (!allowed) return true;
  return allowed.includes(role);
}

export function canApproveReferral(role: UserRole | undefined): boolean {
  return hasPermission(role, 'approveReferral');
}

export function canRejectReferral(role: UserRole | undefined): boolean {
  return hasPermission(role, 'rejectReferral');
}
