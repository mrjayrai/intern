const { baseLayout, renderButton, renderDetailsCard, renderNextSteps, renderStatusBadge, renderDivider, esc } = require('./layout');

module.exports = {
  render: (vars = {}) => {
    const name = vars.name || vars.candidateName || 'Candidate';
    const referralId = vars.referralId || '';
    const subject = `Your Referral Has Been Successfully Received | Intern Flow`;

    const detailRows = [];
    if (referralId) detailRows.push(['Reference ID', referralId]);
    detailRows.push(['Status', 'Received & Under Review']);
    detailRows.push(['Submitted', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })]);

    const html = baseLayout(`
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Referral Submission</p>

      <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:700;color:#0f172a;margin:0 0 8px 0;line-height:1.3;">Referral Received Successfully</h1>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:16px 0 0 0;">
        Hi <strong style="color:#0f172a;">${esc(name)}</strong>,
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        Thank you for submitting your internship referral. We've successfully received your application and our team has begun the initial review process.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        You'll receive updates at each stage of the workflow — from initial screening through to onboarding — so you're always in the loop.
      </p>

      ${renderDetailsCard(detailRows, 'Submission Details')}

      ${renderNextSteps([
        'Our team will review your submission within 2–3 business days.',
        'You\'ll receive an email notification with any updates or requests for additional information.',
        'If your referral proceeds, you\'ll be guided through the onboarding process.',
      ])}

      ${renderDivider()}

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;line-height:1.6;margin:0;">
        Questions about your submission? Reach out at <a href="mailto:support@internflow.io" style="color:#3b82f6;text-decoration:none;">support@internflow.io</a> and include your reference ID for faster assistance.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:24px 0 0 0;">
        Best regards,<br/>
        <strong style="color:#0f172a;">The Intern Flow Team</strong>
      </p>
    `, { preheader: `We've received your referral${referralId ? ` (Ref: ${referralId})` : ''}. Our team will begin reviewing it shortly.` });

    const text = [
      `Hi ${name},`,
      '',
      `Your Referral Has Been Successfully Received`,
      '',
      `Thank you for submitting your internship referral. We've successfully received your application and our team has begun the initial review process.`,
      '',
      referralId ? `Reference ID: ${referralId}` : '',
      `Status: Received & Under Review`,
      '',
      `Next Steps:`,
      `  1. Our team will review your submission within 2–3 business days.`,
      `  2. You'll receive an email notification with any updates or requests for additional information.`,
      `  3. If your referral proceeds, you'll be guided through the onboarding process.`,
      '',
      `Questions? Contact us at support@internflow.io${referralId ? ` and include your reference ID (${referralId})` : ''}.`,
      '',
      `Best regards,`,
      `The Intern Flow Team`,
    ].filter(line => line !== undefined).join('\n');

    return { subject, text, html };
  },
};
