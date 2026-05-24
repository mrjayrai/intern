const { baseLayout, renderDetailsCard, renderNextSteps, renderAlertBanner, renderDivider, esc } = require('./layout');

const STAGE_LABELS = {
  NON_WORKER_ID_PENDING: 'Non-Worker ID Request',
  ACCESS_PROVISIONING: 'Access Provisioning',
  JOINING_FORM_PENDING: 'Onboarding Form Review',
  NDA_PENDING: 'NDA Signature',
  REFERRED: 'Initial Referral Review',
  READY_TO_START: 'Start Preparation',
};

module.exports = {
  render: (vars = {}) => {
    const name = vars.name || 'Team';
    const referralId = vars.referralId || '';
    const stage = vars.stage || '';
    const deadline = vars.deadline || '';
    const hoursRemaining = typeof vars.hoursRemaining === 'number' ? vars.hoursRemaining : null;
    const candidateName = vars.candidateName || '';
    const stageLabel = STAGE_LABELS[stage] || stage || 'Workflow Stage';
    const isUrgent = hoursRemaining !== null && hoursRemaining <= 4;
    const subject = `${isUrgent ? 'URGENT — ' : ''}SLA Warning: ${stageLabel} Deadline Approaching | Intern Flow`;

    const urgencyLevel = hoursRemaining !== null
      ? (hoursRemaining <= 4 ? 'Critical' : hoursRemaining <= 24 ? 'High' : 'Medium')
      : 'High';

    const urgencyMap = { Critical: 'error', High: 'warning', Medium: 'warning' };

    const detailRows = [
      candidateName ? ['Candidate', candidateName] : null,
      referralId ? ['Reference ID', referralId] : null,
      ['Workflow Stage', stageLabel],
      deadline ? ['SLA Deadline', deadline] : null,
      hoursRemaining !== null ? ['Time Remaining', `${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}`] : null,
      ['Priority', urgencyLevel],
    ].filter(Boolean);

    const html = baseLayout(`
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">SLA Alert</p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr>
          <td>
            <span style="display:inline-block;background-color:${isUrgent ? '#fef2f2' : '#fffbeb'};color:${isUrgent ? '#dc2626' : '#d97706'};border:1px solid ${isUrgent ? '#fecaca' : '#fde68a'};font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:0.6px;text-transform:uppercase;">${urgencyLevel} Priority</span>
          </td>
        </tr>
      </table>

      <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#0f172a;margin:0 0 8px 0;line-height:1.3;">SLA Deadline Approaching — Action Required</h1>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:16px 0 0 0;">
        Hi <strong style="color:#0f172a;">${esc(name)}</strong>,
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        This is an automated SLA alert from Intern Flow. A workflow item${candidateName ? ` for <strong style="color:#0f172a;">${esc(candidateName)}</strong>` : ''} is approaching its deadline for the <strong style="color:#0f172a;">${esc(stageLabel)}</strong> stage.
        ${hoursRemaining !== null ? ` Only <strong style="color:${isUrgent ? '#dc2626' : '#d97706'};">${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}</strong> remaining.` : ''}
      </p>

      ${renderAlertBanner(
        isUrgent
          ? `Critical: Less than ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''} remaining. Immediate action is required to prevent an SLA breach.`
          : `SLA deadline is approaching. Please take action promptly to avoid a breach and workflow delays.`,
        isUrgent ? 'error' : 'warning'
      )}

      ${renderDetailsCard(detailRows, 'SLA Alert Details')}

      ${renderNextSteps([
        `Log in to the Intern Flow platform immediately.`,
        `Navigate to the ${stageLabel} queue and locate the flagged item${referralId ? ` (Ref: ${referralId})` : ''}.`,
        `Take the required action before the deadline to prevent an SLA breach.`,
        `If blocked, escalate to your supervisor or team lead immediately.`,
      ])}

      ${renderDivider()}

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;line-height:1.6;margin:0;">
        This is an automated notification. If you believe you received this in error, contact <a href="mailto:support@internflow.io" style="color:#3b82f6;text-decoration:none;">support@internflow.io</a>.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:24px 0 0 0;">
        Intern Flow Platform<br/>
        <strong style="color:#0f172a;">Automated SLA Monitoring</strong>
      </p>
    `, { preheader: `SLA Warning — ${stageLabel}${deadline ? ` deadline: ${deadline}` : ''}. Action required to prevent a breach.` });

    const text = [
      `Hi ${name},`,
      '',
      `SLA Warning — ${stageLabel} Deadline Approaching`,
      '',
      `A workflow item${candidateName ? ` for ${candidateName}` : ''} is approaching its deadline for the ${stageLabel} stage.`,
      hoursRemaining !== null ? `Time Remaining: ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}` : '',
      '',
      candidateName ? `Candidate: ${candidateName}` : '',
      referralId ? `Reference ID: ${referralId}` : '',
      `Workflow Stage: ${stageLabel}`,
      deadline ? `SLA Deadline: ${deadline}` : '',
      `Priority: ${urgencyLevel}`,
      '',
      `Next Steps:`,
      `  1. Log in to the Intern Flow platform immediately.`,
      `  2. Navigate to the ${stageLabel} queue and locate the flagged item${referralId ? ` (Ref: ${referralId})` : ''}.`,
      `  3. Take the required action before the deadline.`,
      `  4. If blocked, escalate to your supervisor immediately.`,
      '',
      `Questions? Contact support@internflow.io`,
      '',
      `Intern Flow Platform`,
      `Automated SLA Monitoring`,
    ].filter(l => l !== undefined && l !== '').join('\n');

    return { subject, text, html };
  },
};
