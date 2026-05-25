const { baseLayout, renderButton, renderDetailsCard, renderNextSteps, renderStatusBadge, renderDivider, esc } = require('./layout');

module.exports = {
  render: (vars = {}) => {
    const name = vars.name || vars.candidateName || 'Candidate';
    const role = vars.role || 'Intern';
    const department = vars.department || 'General';
    const mentor = vars.mentor || 'Your mentor';
    const joiningDate = vars.joiningDate || 'TBD';
    const onboardingPortalLink = vars.onboardingPortalLink || '#';
    const hrContactEmail = vars.hrContactEmail || 'support@internflow.io';
    const offerLetterAttached = vars.offerLetterAttached !== false;

    const subject = `Congratulations! Your Internship Has Been Approved — Welcome to Intern Flow, ${name}!`;

    const detailRows = [
      ['Position', role],
      ['Department', department],
      ['Mentor', mentor],
      ['Joining Date', joiningDate],
      ['Status', 'Approved & Ready for Onboarding'],
    ].filter(Boolean);

    const html = baseLayout(`
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Internship Approval</p>

      <div style="margin-bottom:16px;">${renderStatusBadge('Approved', 'success')}</div>

      <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:700;color:#0f172a;margin:0 0 8px 0;line-height:1.3;">Congratulations, ${esc(name)}!</h1>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:16px 0 0 0;">
        We are thrilled to welcome you to the Intern Flow team! Your internship application has been reviewed and <strong style="color:#10b981;">officially approved</strong> by our HR team.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        ${offerLetterAttached ? 'Your official offer letter is attached to this email.' : 'Your official offer letter has been generated.'} Please review it carefully and retain it for your records.
      </p>

      <!-- Welcome banner -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;background:linear-gradient(135deg,#dcfce7,#dbeafe);border:1px solid #86efac;border-radius:10px;">
        <tr>
          <td align="center" style="padding:28px 24px;">
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:32px;margin:0 0 8px 0;">🎉</p>
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:#1e3a5f;margin:0 0 6px 0;">Welcome to Your Internship Journey!</p>
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#475569;margin:0;">You're about to embark on an exciting professional experience</p>
          </td>
        </tr>
      </table>

      ${renderDetailsCard(detailRows, 'Your Internship Details')}

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:24px 0 0 0;">
        <strong style="color:#0f172a;">Your mentor, ${esc(mentor)},</strong> will be guiding you throughout your internship. You'll receive an introduction and further instructions shortly.
      </p>

      ${renderButton('Access Onboarding Portal', onboardingPortalLink, { marginTop: '24px', marginBottom: '8px' })}

      ${renderNextSteps([
        'Download and review your offer letter attached to this email.',
        'Access the onboarding portal using the button above to complete required documentation.',
        'Complete all onboarding forms, upload required documents, and sign the NDA.',
        'You will receive further instructions regarding system access and your start date.',
        `For questions or assistance, contact HR at ${hrContactEmail}.`,
      ])}

      ${renderDivider()}

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;background-color:#fef3c7;border-left:3px solid #f59e0b;padding:14px 18px;border-radius:0 6px 6px 0;">
        <tr>
          <td>
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#92400e;line-height:1.6;margin:0;">
              <strong style="color:#78350f;">Important:</strong> Please complete your onboarding within the next 7 days to ensure a smooth start to your internship.
            </p>
          </td>
        </tr>
      </table>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;line-height:1.6;margin:20px 0 0 0;">
        Need help? Contact our HR team at <a href="mailto:${esc(hrContactEmail)}" style="color:#3b82f6;text-decoration:none;">${esc(hrContactEmail)}</a>.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:24px 0 0 0;">
        We're excited to have you on board!<br/>
        <strong style="color:#0f172a;">The Intern Flow HR Team</strong>
      </p>
    `, { preheader: `Congratulations ${name}! Your internship has been approved. Review your offer letter and complete onboarding.` });

    const text = [
      `Congratulations, ${name}!`,
      '',
      'Your Internship Has Been Approved',
      '',
      `We are thrilled to welcome you to the Intern Flow team! Your internship application has been reviewed and officially approved by our HR team.`,
      '',
      `Position: ${role}`,
      `Department: ${department}`,
      `Mentor: ${mentor}`,
      `Joining Date: ${joiningDate}`,
      '',
      offerLetterAttached ? 'Your official offer letter is attached to this email.' : 'Your official offer letter has been generated.',
      '',
      `Access your onboarding portal: ${onboardingPortalLink}`,
      '',
      'Next Steps:',
      '  1. Download and review your offer letter attached to this email.',
      '  2. Access the onboarding portal to complete required documentation.',
      '  3. Complete all onboarding forms, upload documents, and sign the NDA.',
      '  4. You will receive instructions regarding system access and start date.',
      `  5. For questions, contact HR at ${hrContactEmail}.`,
      '',
      'Important: Please complete your onboarding within the next 7 days.',
      '',
      `Need help? Contact us at ${hrContactEmail}`,
      '',
      "We're excited to have you on board!",
      'The Intern Flow HR Team',
    ].filter(l => l !== undefined).join('\n');

    return { subject, text, html };
  },
};
