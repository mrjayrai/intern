const { baseLayout, renderButton, renderDetailsCard, renderNextSteps, renderAlertBanner, renderDivider, esc } = require('./layout');

module.exports = {
  render: (vars = {}) => {
    const name = vars.name || 'Team';
    const referralId = vars.referralId || '';
    const stage = vars.stage || '';
    const reason = vars.reason || '';
    const deadline = vars.deadline || '';
    const subject = `Urgent: Escalation — Immediate Action Required${referralId ? ` (Ref: ${referralId})` : ''} | Intern Flow`;

    const detailRows = [
      referralId ? ['Reference ID', referralId] : null,
      stage ? ['Workflow Stage', stage] : null,
      reason ? ['Reason', reason] : null,
      deadline ? ['Deadline', deadline] : null,
      ['Priority', 'High — Immediate Action Required'],
    ].filter(Boolean);

    const html = baseLayout(`
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Workflow Escalation</p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr>
          <td>
            <span style="display:inline-block;background-color:#fef2f2;color:#dc2626;border:1px solid #fecaca;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:0.6px;text-transform:uppercase;">Urgent — High Priority</span>
          </td>
        </tr>
      </table>

      <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#0f172a;margin:0 0 8px 0;line-height:1.3;">Escalation: Immediate Action Required</h1>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:16px 0 0 0;">
        Hi <strong style="color:#0f172a;">${esc(name)}</strong>,
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        This is an automated escalation notification from Intern Flow. A referral in your workflow${referralId ? ` (Ref: <strong style="color:#0f172a;">${esc(referralId)}</strong>)` : ''} has been flagged and requires your immediate attention.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        Unresolved escalations may cause SLA breaches or delays to the candidate's onboarding timeline. Please review and take action as soon as possible.
      </p>

      ${renderAlertBanner('This escalation requires prompt action to prevent SLA breaches and onboarding delays.', 'error')}

      ${renderDetailsCard(detailRows, 'Escalation Details')}

      ${renderNextSteps([
        'Log in to the Intern Flow platform immediately.',
        `Review the flagged referral${referralId ? ` (Ref: ${referralId})` : ''} in the Internship Tracking section.`,
        'Take the appropriate action to resolve the escalation.',
        'Update the workflow status to confirm resolution.',
      ])}

      ${renderDivider()}

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;line-height:1.6;margin:0;">
        This is an automated notification. If you believe you received this in error, or need assistance, contact us at <a href="mailto:support@internflow.io" style="color:#3b82f6;text-decoration:none;">support@internflow.io</a>.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:24px 0 0 0;">
        Intern Flow Platform<br/>
        <strong style="color:#0f172a;">Automated Workflow Notifications</strong>
      </p>
    `, { preheader: `Urgent escalation: ${referralId ? `Ref ${referralId} — ` : ''}Immediate action required in your workflow.` });

    const text = [
      `Hi ${name},`,
      '',
      `Urgent Escalation — Immediate Action Required`,
      '',
      `This is an automated escalation notification from Intern Flow. A referral in your workflow${referralId ? ` (Ref: ${referralId})` : ''} has been flagged and requires your immediate attention.`,
      '',
      referralId ? `Reference ID: ${referralId}` : '',
      stage ? `Workflow Stage: ${stage}` : '',
      reason ? `Reason: ${reason}` : '',
      deadline ? `Deadline: ${deadline}` : '',
      `Priority: High — Immediate Action Required`,
      '',
      `Next Steps:`,
      `  1. Log in to the Intern Flow platform immediately.`,
      `  2. Review the flagged referral${referralId ? ` (Ref: ${referralId})` : ''} in the Internship Tracking section.`,
      `  3. Take the appropriate action to resolve the escalation.`,
      `  4. Update the workflow status to confirm resolution.`,
      '',
      `Questions? Contact us at support@internflow.io`,
      '',
      `Intern Flow Platform`,
      `Automated Workflow Notifications`,
    ].filter(l => l !== undefined).join('\n');

    return { subject, text, html };
  },
};
