const { baseLayout, renderButton, renderDetailsCard, renderNextSteps, renderAlertBanner, renderDivider, esc } = require('./layout');

module.exports = {
  render: (vars = {}) => {
    const name = vars.name || 'Candidate';
    const referralId = vars.referralId || '';
    const subject = `Reminder: Your NDA Signature Is Still Pending | Intern Flow`;

    const detailRows = [
      ['Status', 'Pending Signature'],
      referralId ? ['Reference ID', referralId] : null,
      ['Action Required', 'Electronic signature needed'],
    ].filter(Boolean);

    const html = baseLayout(`
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">NDA Signature Reminder</p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr>
          <td>
            <span style="display:inline-block;background-color:#fffbeb;color:#d97706;border:1px solid #fde68a;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:0.6px;text-transform:uppercase;">Action Required</span>
          </td>
        </tr>
      </table>

      <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#0f172a;margin:0 0 8px 0;line-height:1.3;">Your NDA Is Still Awaiting Your Signature</h1>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:16px 0 0 0;">
        Hi <strong style="color:#0f172a;">${esc(name)}</strong>,
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        This is a friendly reminder that your Non-Disclosure Agreement is still waiting for your electronic signature. Signing your NDA is a required step before your onboarding can continue.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        Please take a moment to review and sign the document to keep your onboarding on track.
      </p>

      ${renderAlertBanner('Your NDA signature is required to proceed with onboarding. Delays may affect your internship start date.', 'warning')}

      ${renderDetailsCard(detailRows, 'Pending Action')}

      ${renderNextSteps([
        'Log in to the Intern Flow portal.',
        'Navigate to the NDA &amp; Documents section.',
        'Review the document and sign electronically.',
      ])}

      ${renderDivider()}

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;line-height:1.6;margin:0;">
        If you've already signed your NDA or believe you received this reminder in error, please contact us at <a href="mailto:support@internflow.io" style="color:#3b82f6;text-decoration:none;">support@internflow.io</a>.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:24px 0 0 0;">
        Best regards,<br/>
        <strong style="color:#0f172a;">The Intern Flow Compliance Team</strong>
      </p>
    `, { preheader: `Reminder: Your NDA is still awaiting your signature. Please sign to keep your onboarding on track.` });

    const text = [
      `Hi ${name},`,
      '',
      `Reminder: Your NDA Is Still Awaiting Your Signature`,
      '',
      `This is a friendly reminder that your Non-Disclosure Agreement${referralId ? ` for referral ${referralId}` : ''} is still waiting for your electronic signature.`,
      '',
      `Signing your NDA is a required step before your onboarding can continue. Please take a moment to review and sign the document to keep your onboarding on track.`,
      '',
      `Status: Pending Signature`,
      referralId ? `Reference ID: ${referralId}` : '',
      '',
      `Next Steps:`,
      `  1. Log in to the Intern Flow portal.`,
      `  2. Navigate to the NDA & Documents section.`,
      `  3. Review the document and sign electronically.`,
      '',
      `If you've already signed your NDA or received this reminder in error, contact us at support@internflow.io`,
      '',
      `Best regards,`,
      `The Intern Flow Compliance Team`,
    ].filter(l => l !== undefined).join('\n');

    return { subject, text, html };
  },
};
