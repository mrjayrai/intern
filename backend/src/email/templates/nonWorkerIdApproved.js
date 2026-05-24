const { baseLayout, renderDetailsCard, renderNextSteps, renderStatusBadge, renderDivider, esc } = require('./layout');

module.exports = {
  render: (vars = {}) => {
    const name = vars.name || vars.candidateName || 'Candidate';
    const requestId = vars.requestId || '';
    const employeeId = vars.employeeId || '';
    const approvedBy = vars.approvedBy || 'HR Team';
    const comment = vars.comment || '';
    const subject = `Your Non-Worker ID Request Has Been Approved | Intern Flow`;

    const detailRows = [
      ['Status', 'Approved'],
      requestId ? ['Request ID', requestId] : null,
      employeeId ? ['Non-Worker ID', employeeId] : null,
      ['Approved By', approvedBy],
    ].filter(Boolean);

    const html = baseLayout(`
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Non-Worker ID Request</p>

      <div style="margin-bottom:16px;">${renderStatusBadge('Approved', 'success')}</div>

      <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#0f172a;margin:0 0 8px 0;line-height:1.3;">Your Non-Worker ID Has Been Approved</h1>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:16px 0 0 0;">
        Hi <strong style="color:#0f172a;">${esc(name)}</strong>,
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        Great news! Your Non-Worker ID request has been reviewed and approved by our HR team. Your ID provisioning process has now been initiated and system access setup will begin shortly.
      </p>

      ${comment ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
        <tr>
          <td style="background-color:#f0fdf4;border-left:3px solid #10b981;padding:12px 16px;border-radius:0 6px 6px 0;">
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#475569;line-height:1.6;margin:0;"><strong style="color:#0f172a;">Note from HR:</strong> ${esc(comment)}</p>
          </td>
        </tr>
      </table>` : ''}

      ${renderDetailsCard(detailRows, 'Approval Details')}

      ${renderNextSteps([
        'Your system access provisioning has been initiated.',
        'You\'ll receive a separate notification when your accounts and access are ready.',
        'Collect your physical ID badge from the HR office on your first day.',
      ])}

      ${renderDivider()}

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;line-height:1.6;margin:0;">
        Questions? Contact us at <a href="mailto:support@internflow.io" style="color:#3b82f6;text-decoration:none;">support@internflow.io</a>.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:24px 0 0 0;">
        Best regards,<br/>
        <strong style="color:#0f172a;">The Intern Flow HR Team</strong>
      </p>
    `, { preheader: `Your Non-Worker ID request has been approved. System access provisioning has begun.` });

    const text = [
      `Hi ${name},`,
      '',
      `Your Non-Worker ID Has Been Approved`,
      '',
      `Great news! Your Non-Worker ID request has been reviewed and approved by our HR team.`,
      '',
      `Status: Approved`,
      requestId ? `Request ID: ${requestId}` : '',
      employeeId ? `Non-Worker ID: ${employeeId}` : '',
      `Approved By: ${approvedBy}`,
      comment ? `\nNote from HR: ${comment}` : '',
      '',
      `Next Steps:`,
      `  1. Your system access provisioning has been initiated.`,
      `  2. You'll receive a separate notification when your accounts and access are ready.`,
      `  3. Collect your physical ID badge from the HR office on your first day.`,
      '',
      `Questions? Contact us at support@internflow.io`,
      '',
      `Best regards,`,
      `The Intern Flow HR Team`,
    ].filter(l => l !== undefined).join('\n');

    return { subject, text, html };
  },
};
