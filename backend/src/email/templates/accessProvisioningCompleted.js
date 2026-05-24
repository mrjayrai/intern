const { baseLayout, renderDetailsCard, renderNextSteps, renderStatusBadge, renderDivider, esc } = require('./layout');

module.exports = {
  render: (vars = {}) => {
    const name = vars.name || vars.candidateName || 'Candidate';
    const systems = Array.isArray(vars.systems) ? vars.systems : (vars.systemAccess ? String(vars.systemAccess).split(',').map(s => s.trim()) : []);
    const itContact = vars.itContact || 'support@internflow.io';
    const startDate = vars.startDate || '';
    const subject = `Your System Access Is Ready — Welcome Aboard, ${name}! | Intern Flow`;

    const checklist = [
      { label: 'Active Directory Account', done: vars.adAccountCreated !== false },
      { label: 'Corporate Email', done: vars.emailProvisioned !== false },
      { label: 'VPN Access', done: vars.vpnAccess !== false },
      { label: 'Badge Access', done: vars.badgeAccess !== false },
      { label: 'OTP / MFA Delivered', done: vars.otpSent !== false },
    ];

    const checklistRows = checklist.map(item => `
      <tr>
        <td style="padding:6px 0;vertical-align:top;border-bottom:1px solid #f1f5f9;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="width:20px;vertical-align:middle;">
                ${item.done
                  ? '<span style="display:inline-block;width:18px;height:18px;background-color:#059669;border-radius:50%;text-align:center;line-height:18px;font-size:10px;color:#fff;font-weight:bold;">&#10003;</span>'
                  : '<span style="display:inline-block;width:18px;height:18px;background-color:#e2e8f0;border-radius:50%;text-align:center;line-height:18px;font-size:10px;color:#94a3b8;">&#8722;</span>'
                }
              </td>
              <td style="padding-left:10px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${item.done ? '#0f172a' : '#94a3b8'};vertical-align:middle;">${esc(item.label)}</td>
            </tr>
          </table>
        </td>
      </tr>`).join('');

    const detailRows = [
      ['Status', 'Fully Provisioned'],
      systems.length ? ['Access Granted', systems.join(', ')] : null,
      startDate ? ['Internship Start', startDate] : null,
    ].filter(Boolean);

    const html = baseLayout(`
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Access Provisioning</p>

      <div style="margin-bottom:16px;">${renderStatusBadge('Fully Provisioned', 'success')}</div>

      <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#0f172a;margin:0 0 8px 0;line-height:1.3;">You're All Set — Access Ready!</h1>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:16px 0 0 0;">
        Hi <strong style="color:#0f172a;">${esc(name)}</strong>,
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        Your system access has been fully provisioned. All accounts, credentials, and access rights are now active and ready for your first day. You'll find a summary of what's been set up below.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
        <tr>
          <td style="padding:18px 20px;">
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 12px 0;">Access Checklist</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${checklistRows}
            </table>
          </td>
        </tr>
      </table>

      ${renderDetailsCard(detailRows, 'Provisioning Summary')}

      ${renderNextSteps([
        'Check your corporate email inbox for login credentials and setup instructions.',
        'Follow the onboarding guide in the Intern Flow portal to complete remaining steps.',
        'Arrive on your first day with your government-issued photo ID to collect your access badge.',
        `Questions about system access? Contact IT at ${itContact}.`,
      ])}

      ${renderDivider()}

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:0;">
        We're looking forward to having you on the team. Welcome aboard!
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:24px 0 0 0;">
        Best regards,<br/>
        <strong style="color:#0f172a;">The Intern Flow IT Team</strong>
      </p>
    `, { preheader: `Your system access is fully set up. Check your credentials and get ready for day one!` });

    const text = [
      `Hi ${name},`,
      '',
      `You're All Set — System Access Ready`,
      '',
      `Your system access has been fully provisioned. All accounts, credentials, and access rights are now active and ready for your first day.`,
      '',
      `Status: Fully Provisioned`,
      systems.length ? `Access Granted: ${systems.join(', ')}` : '',
      startDate ? `Internship Start: ${startDate}` : '',
      '',
      `Access Checklist:`,
      ...checklist.map(item => `  ${item.done ? '✓' : '-'} ${item.label}`),
      '',
      `Next Steps:`,
      `  1. Check your corporate email for login credentials.`,
      `  2. Follow the onboarding guide in the Intern Flow portal.`,
      `  3. Bring a government-issued photo ID on your first day.`,
      '',
      `IT contact: ${itContact}`,
      '',
      `Welcome aboard!`,
      '',
      `Best regards,`,
      `The Intern Flow IT Team`,
    ].filter(l => l !== undefined && l !== '').join('\n');

    return { subject, text, html };
  },
};
