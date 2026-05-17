const { WORKFLOW_STAGES } = require('../constants/workflowStages');

const validateReferralPayload = (payload, isUpdate = false) => {
  const errors = [];
  const requiredFields = ['candidateName', 'candidateEmail', 'candidatePhone'];

  if (!isUpdate) {
    requiredFields.forEach((field) => {
      if (!payload[field]) {
        errors.push(`${field} is required`);
      }
    });
  }

  if (payload.candidateEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.candidateEmail)) {
      errors.push('candidateEmail must be a valid email address');
    }
  }

  if (payload.skills && !Array.isArray(payload.skills) && typeof payload.skills !== 'string') {
    errors.push('skills must be an array of strings or a comma-separated string');
  }

  if (payload.workflowStage && !Object.values(WORKFLOW_STAGES).includes(payload.workflowStage)) {
    errors.push('workflowStage is invalid');
  }

  return errors;
};

const buildReferralPayload = (body, file) => {
  const data = {
    candidateName: body.candidateName,
    candidateEmail: body.candidateEmail,
    candidatePhone: body.candidatePhone,
    skills: body.skills && typeof body.skills === 'string'
      ? body.skills.split(',').map((skill) => skill.trim()).filter(Boolean)
      : Array.isArray(body.skills)
      ? body.skills
      : [],
    education: body.education,
    mentor: body.mentor,
    referrer: body.referrer,
    status: body.status,
    internshipDuration: body.internshipDuration,
    projectOverview: body.projectOverview,
    location: body.location,
    workflowStage: body.workflowStage,
    slaDeadline: body.slaDeadline ? new Date(body.slaDeadline) : undefined,
  };

  if (file) {
    data.resume = `/uploads/resumes/${file.filename}`;
  }

  return data;
};

module.exports = {
  validateReferralPayload,
  buildReferralPayload,
};
