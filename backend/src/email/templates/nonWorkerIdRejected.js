const { baseLayout, renderDetailsCard, renderNextSteps, renderStatusBadge, renderAlertBanner, renderDivider, esc } = require('./layout');

module.exports = {
  render: (vars = {}) => {
    const name = vars.name || vars.candidateName || 'Candidate';
    const requestId = vars.requestId || '';
    const reason = vars.reason || '';
    const rejectedBy = vars.rejectedBy || 'HR Team';
    const subject = `Update on Your Non-Worker ID Request | Intern Flow`;

    const detailRows = [
      ['Status', 'Not Approved'],
      requestId ? ['Request ID', requestId] : null,
      ['Reviewed By', rejectedBy],
      reason ? ['Reason', reason] : null,
    ].filter(Boolean);

    const html = baseLayout(`
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Non-Worker ID Request</p>

      <div style="margin-bottom:16px;">${renderStatusBadge('Not Approved', 'error')}</div>

      <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#0f172a;margin:0 0 8px 0;line-height:1.3;">Your ID Request Could Not Be Approved</h1>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:16px 0 0 0;">
        Hi <strong style="color:#0f172a;">${esc(name)}</strong>,
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        Thank you for submitting your Non-Worker ID request. After review, we were unable to approve your request at this time. Please review the details below and contact our HR team for guidance on next steps.
      </p>

      ${renderAlertBanner('Please contact your HR representative for further instructions on resubmitting or resolving this request.', 'error')}

      ${renderDetailsCard(detailRows, 'Review Details')}

      ${reason ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
        <tr>
          <td style="background-color:#fef2f2;border-left:3px solid #ef4444;padding:12px 16px;border-radius:0 6px 6px 0;">
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#475569;line-height:1.6;margin:0;"><strong style="color:#0f172a;">Reason provided:</strong> ${esc(reason)}</p>
          </td>
        </tr>
      </table>` : ''}

      ${renderNextSteps([
        'Review the reason provided above.',
        'Contact your HR representative to discuss the decision.',
        'If applicable, address the noted concerns and resubmit your request.',
      ])}

      ${renderDivider()}

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;line-height:1.6;margin:0;">
        Need assistance? Reach out to us at <a href="mailto:support@internflow.io" style="color:#3b82f6;text-decoration:none;">support@internflow.io</a>.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:24px 0 0 0;">
        Best regards,<br/>
        <strong style="color:#0f172a;">The Intern Flow HR Team</strong>
      </p>
    `, { preheader: `An update on your Non-Worker ID request — please review the details and contact HR.` });

    const text = [
      `Hi ${name},`,
      '',
      `Update on Your Non-Worker ID Request`,
      '',
      `Thank you for submitting your Non-Worker ID request. After review, we were unable to approve your request at this time.`,
      '',
      `Status: Not Approved`,
      requestId ? `Request ID: ${requestId}` : '',
      `Reviewed By: ${rejectedBy}`,
      reason ? `Reason: ${reason}` : '',
      '',
      `Next Steps:`,
      `  1. Review the reason provided above.`,
      `  2. Contact your HR representative to discuss the decision.`,
      `  3. If applicable, address the noted concerns and resubmit your request.`,
      '',
      `Need assistance? Contact us at support@internflow.io`,
      '',
      `Best regards,`,
      `The Intern Flow HR Team`,
    ].filter(l => l !== undefined).join('\n');

    return { subject, text, html };
  },
};
