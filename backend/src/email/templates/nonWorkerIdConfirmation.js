const { baseLayout, renderDetailsCard, renderNextSteps, renderStatusBadge, renderDivider, esc } = require('./layout');

module.exports = {
  render: (vars = {}) => {
    const name = vars.name || vars.candidateName || 'Candidate';
    const referralId = vars.referralId || '';
    const requestId = vars.requestId || '';
    const slaDeadline = vars.slaDeadline || '';
    const subject = `Your Non-Worker ID Request Has Been Received | Intern Flow`;

    const detailRows = [
      name !== 'Candidate' ? ['Requested For', name] : null,
      requestId ? ['Request ID', requestId] : null,
      referralId ? ['Referral Reference', referralId] : null,
      ['Status', 'Pending HR Review'],
      slaDeadline ? ['Expected By', slaDeadline] : null,
    ].filter(Boolean);

    const html = baseLayout(`
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Non-Worker ID Request</p>

      <div style="margin-bottom:16px;">${renderStatusBadge('Request Received', 'info')}</div>

      <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#0f172a;margin:0 0 8px 0;line-height:1.3;">Your ID Request Is Being Processed</h1>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:16px 0 0 0;">
        Hi <strong style="color:#0f172a;">${esc(name)}</strong>,
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        Your Non-Worker ID request has been successfully submitted and is now queued for HR review. A non-worker ID is required for system access and facility entry during your internship.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        You will receive a notification once your request has been reviewed and approved.
      </p>

      ${renderDetailsCard(detailRows, 'Request Details')}

      ${renderNextSteps([
        'HR will review your request within the expected timeframe.',
        'You\'ll receive an email confirmation once your request is approved.',
        'Your Non-Worker ID will be issued and ready for use when onboarding begins.',
      ])}

      ${renderDivider()}

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;line-height:1.6;margin:0;">
        Questions about your ID request? Contact us at <a href="mailto:support@internflow.io" style="color:#3b82f6;text-decoration:none;">support@internflow.io</a>.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:24px 0 0 0;">
        Best regards,<br/>
        <strong style="color:#0f172a;">The Intern Flow HR Team</strong>
      </p>
    `, { preheader: `Your Non-Worker ID request has been received and is pending HR review.` });

    const text = [
      `Hi ${name},`,
      '',
      `Your Non-Worker ID Request Has Been Received`,
      '',
      `Your Non-Worker ID request has been successfully submitted and is now queued for HR review.`,
      '',
      requestId ? `Request ID: ${requestId}` : '',
      referralId ? `Referral Reference: ${referralId}` : '',
      `Status: Pending HR Review`,
      slaDeadline ? `Expected By: ${slaDeadline}` : '',
      '',
      `Next Steps:`,
      `  1. HR will review your request within the expected timeframe.`,
      `  2. You'll receive an email confirmation once your request is approved.`,
      `  3. Your Non-Worker ID will be issued and ready for use when onboarding begins.`,
      '',
      `Questions? Contact us at support@internflow.io`,
      '',
      `Best regards,`,
      `The Intern Flow HR Team`,
    ].filter(l => l !== undefined && l !== '').join('\n');

    return { subject, text, html };
  },
};
