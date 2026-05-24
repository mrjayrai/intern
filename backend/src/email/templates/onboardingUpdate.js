const { baseLayout, renderDetailsCard, renderNextSteps, renderStatusBadge, renderDivider, esc } = require('./layout');

const STATUS_CONFIG = {
  DRAFT: {
    badgeLabel: 'Draft Saved',
    badgeType: 'neutral',
    headline: 'Your Onboarding Form Has Been Saved',
    intro: 'Your onboarding form has been saved as a draft. You can return at any time to continue filling in the required information.',
    nextSteps: [
      'Log in to the Intern Flow portal to continue your onboarding.',
      'Complete all required sections before submitting.',
      'Upload any requested documents in the attachments section.',
    ],
  },
  SUBMITTED: {
    badgeLabel: 'Submitted',
    badgeType: 'info',
    headline: 'Onboarding Form Submitted for Review',
    intro: 'Thank you! Your onboarding form has been successfully submitted and is now under review by our HR team. We\'ll be in touch as soon as it\'s been processed.',
    nextSteps: [
      'HR will review your submission within 2–3 business days.',
      'You\'ll receive a confirmation email once your form is approved.',
      'Ensure your contact details are up to date in case HR needs to reach you.',
    ],
  },
  HR_APPROVED: {
    badgeLabel: 'HR Approved',
    badgeType: 'success',
    headline: 'Your Onboarding Has Been Approved',
    intro: 'Congratulations! Your onboarding form has been reviewed and approved by HR. The next stage of your onboarding workflow — Non-Worker ID and system access provisioning — has been initiated automatically.',
    nextSteps: [
      'Your Non-Worker ID request has been raised — you\'ll be notified when approved.',
      'System access provisioning will begin once your ID is confirmed.',
      'Await further instructions from your HR representative regarding your start date.',
    ],
  },
};

module.exports = {
  render: (vars = {}) => {
    const name = vars.name || vars.candidateName || 'Candidate';
    const status = vars.status || 'SUBMITTED';
    const stage = vars.stage || '';
    const completionPercentage = typeof vars.completionPercentage === 'number' ? vars.completionPercentage : null;
    const message = vars.message || '';
    const approvedBy = vars.approvedBy || '';
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.SUBMITTED;
    const subject = `Onboarding Update: ${cfg.badgeLabel} | Intern Flow`;

    const detailRows = [
      ['Status', cfg.badgeLabel],
      stage ? ['Workflow Stage', stage] : null,
      completionPercentage !== null ? ['Form Completion', `${completionPercentage}%`] : null,
      approvedBy ? ['Reviewed By', approvedBy] : null,
    ].filter(Boolean);

    const progressBar = completionPercentage !== null ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;">
              <tr>
                <td>
                  <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 10px 0;">Form Completion</p>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="background-color:#e2e8f0;border-radius:4px;height:8px;overflow:hidden;">
                        <table cellpadding="0" cellspacing="0" border="0" style="width:${completionPercentage}%;height:8px;background:linear-gradient(90deg,#3b82f6,#8b5cf6);border-radius:4px;">
                          <tr><td></td></tr>
                        </table>
                      </td>
                      <td style="width:48px;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#0f172a;padding-left:12px;">${completionPercentage}%</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>` : '';

    const html = baseLayout(`
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Onboarding Progress</p>

      <div style="margin-bottom:16px;">${renderStatusBadge(cfg.badgeLabel, cfg.badgeType)}</div>

      <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#0f172a;margin:0 0 8px 0;line-height:1.3;">${cfg.headline}</h1>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:16px 0 0 0;">
        Hi <strong style="color:#0f172a;">${esc(name)}</strong>,
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        ${esc(cfg.intro)}
      </p>

      ${message ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
        <tr>
          <td style="background-color:#eff6ff;border-left:3px solid #3b82f6;padding:12px 16px;border-radius:0 6px 6px 0;">
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#475569;line-height:1.6;margin:0;"><strong style="color:#0f172a;">Message from HR:</strong> ${esc(message)}</p>
          </td>
        </tr>
      </table>` : ''}

      ${progressBar}

      ${renderDetailsCard(detailRows, 'Onboarding Details')}

      ${renderNextSteps(cfg.nextSteps)}

      ${renderDivider()}

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;line-height:1.6;margin:0;">
        Questions about your onboarding? Contact us at <a href="mailto:support@internflow.io" style="color:#3b82f6;text-decoration:none;">support@internflow.io</a>.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:24px 0 0 0;">
        Best regards,<br/>
        <strong style="color:#0f172a;">The Intern Flow HR Team</strong>
      </p>
    `, { preheader: `Onboarding update for ${name}: ${cfg.badgeLabel}. ${cfg.intro.slice(0, 60)}` });

    const text = [
      `Hi ${name},`,
      '',
      cfg.headline,
      '',
      cfg.intro,
      '',
      `Status: ${cfg.badgeLabel}`,
      stage ? `Workflow Stage: ${stage}` : '',
      completionPercentage !== null ? `Form Completion: ${completionPercentage}%` : '',
      approvedBy ? `Reviewed By: ${approvedBy}` : '',
      message ? `\nMessage from HR: ${message}` : '',
      '',
      `Next Steps:`,
      ...cfg.nextSteps.map((s, i) => `  ${i + 1}. ${s}`),
      '',
      `Questions? Contact us at support@internflow.io`,
      '',
      `Best regards,`,
      `The Intern Flow HR Team`,
    ].filter(l => l !== undefined && l !== '').join('\n');

    return { subject, text, html };
  },
};
