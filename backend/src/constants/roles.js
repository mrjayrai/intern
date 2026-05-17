const ROLES = {
  SUPER_ADMIN: 'superAdmin',
  HR: 'hr',
  MENTOR: 'mentor',
  REFERRER: 'referrer',
  CANDIDATE: 'candidate',
  IT: 'it',
  COMPLIANCE: 'compliance',
};

const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.HR];

module.exports = {
  ROLES,
  ADMIN_ROLES,
};
