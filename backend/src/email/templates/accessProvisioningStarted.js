const { baseLayout, renderDetailsCard, renderNextSteps, renderStatusBadge, renderDivider, esc } = require('./layout');

module.exports = {
  render: (vars = {}) => {
    const name = vars.name || vars.candidateName || 'Candidate';
    const systems = Array.isArray(vars.systems) ? vars.systems : (vars.systemAccess ? String(vars.systemAccess).split(',').map(s => s.trim()) : []);
    const itContact = vars.itContact || 'support@internflow.io';
    const estimatedCompletion = vars.estimatedCompletion || '';
    const subject = `Your System Access Setup Has Begun | Intern Flow`;

    const detailRows = [
      ['Status', 'In Progress'],
      systems.length ? ['Systems Being Provisioned', systems.join(', ')] : null,
      estimatedCompletion ? ['Estimated Completion', estimatedCompletion] : null,
      ['IT Contact', itContact],
    ].filter(Boolean);

    const systemsList = systems.length
      ? systems.map(s => `
        <tr>
          <td style="padding:5px 0;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width:8px;height:8px;background-color:#3b82f6;border-radius:50%;vertical-align:middle;"></td>
                <td style="padding-left:10px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#475569;vertical-align:middle;">${esc(s)}</td>
              </tr>
            </table>
          </td>
        </tr>`).join('')
      : '';

    const html = baseLayout(`
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Access Provisioning</p>

      <div style="margin-bottom:16px;">${renderStatusBadge('In Progress', 'info')}</div>

      <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#0f172a;margin:0 0 8px 0;line-height:1.3;">Your System Access Is Being Set Up</h1>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:16px 0 0 0;">
        Hi <strong style="color:#0f172a;">${esc(name)}</strong>,
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        Your IT access provisioning is now underway. Our IT team is setting up the system accounts and access credentials you'll need for your internship. This process is typically completed within one business day.
      </p>

      ${systemsList ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
        <tr>
          <td style="padding:18px 20px;">
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 12px 0;">Systems Being Configured</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${systemsList}
            </table>
          </td>
        </tr>
      </table>` : ''}

      ${renderDetailsCard(detailRows.filter(([l]) => l !== 'Systems Being Provisioned'), 'Provisioning Details')}

      ${renderNextSteps([
        'Your accounts are being created and configured by the IT team.',
        'You\'ll receive login credentials and access instructions once setup is complete.',
        'Keep an eye on your email for a separate notification with your access details.',
      ])}

      ${renderDivider()}

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;line-height:1.6;margin:0;">
        Questions about your access setup? Contact the IT team at <a href="mailto:${esc(itContact)}" style="color:#3b82f6;text-decoration:none;">${esc(itContact)}</a>.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:24px 0 0 0;">
        Best regards,<br/>
        <strong style="color:#0f172a;">The Intern Flow IT Team</strong>
      </p>
    `, { preheader: `Your system access provisioning has started. IT is setting up your accounts and credentials.` });

    const text = [
      `Hi ${name},`,
      '',
      `Your System Access Setup Has Begun`,
      '',
      `Your IT access provisioning is now underway. Our IT team is setting up the system accounts and access credentials you'll need for your internship.`,
      '',
      `Status: In Progress`,
      systems.length ? `Systems: ${systems.join(', ')}` : '',
      estimatedCompletion ? `Estimated Completion: ${estimatedCompletion}` : '',
      '',
      `Next Steps:`,
      `  1. Your accounts are being created and configured by the IT team.`,
      `  2. You'll receive login credentials and access instructions once setup is complete.`,
      `  3. Keep an eye on your email for a separate notification with your access details.`,
      '',
      `Questions? Contact the IT team at ${itContact}`,
      '',
      `Best regards,`,
      `The Intern Flow IT Team`,
    ].filter(l => l !== undefined && l !== '').join('\n');

    return { subject, text, html };
  },
};
