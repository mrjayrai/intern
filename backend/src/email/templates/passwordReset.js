const { baseLayout, renderButton, renderDetailsCard, renderAlertBanner, renderDivider, esc } = require('./layout');

module.exports = {
  render: (vars = {}) => {
    const name = vars.name || 'User';
    const resetUrl = vars.resetUrl || '#';
    const expiresIn = vars.expiresIn || '1 hour';
    const ipAddress = vars.ipAddress || '';
    const subject = `Password Reset Request | Intern Flow`;

    const detailRows = [
      ['Requested For', name],
      ['Link Expires In', expiresIn],
      ipAddress ? ['Request Origin', ipAddress] : null,
    ].filter(Boolean);

    const html = baseLayout(`
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Account Security</p>

      <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#0f172a;margin:0 0 8px 0;line-height:1.3;">Reset Your Password</h1>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:16px 0 0 0;">
        Hi <strong style="color:#0f172a;">${esc(name)}</strong>,
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        We received a request to reset the password for your Intern Flow account. If you made this request, click the button below to set a new password. This link will expire in <strong>${esc(expiresIn)}</strong>.
      </p>

      ${renderButton('Reset My Password', resetUrl, { marginTop: '24px', marginBottom: '8px' })}

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;margin:12px 0 0 0;line-height:1.5;">
        Or copy and paste this link into your browser:<br/>
        <span style="color:#3b82f6;word-break:break-all;">${esc(resetUrl)}</span>
      </p>

      ${renderAlertBanner('If you did not request a password reset, please ignore this email. Your password will remain unchanged. If you\'re concerned about your account security, contact us immediately.', 'warning')}

      ${renderDetailsCard(detailRows, 'Request Details')}

      ${renderDivider()}

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;line-height:1.6;margin:0;">
        For security reasons, this link can only be used once and will expire automatically. If you need a new reset link, return to the login page and request another.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;line-height:1.6;margin:12px 0 0 0;">
        Didn't request this? Contact us immediately at <a href="mailto:support@internflow.io" style="color:#3b82f6;text-decoration:none;">support@internflow.io</a>.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:24px 0 0 0;">
        Regards,<br/>
        <strong style="color:#0f172a;">Intern Flow Account Security</strong>
      </p>
    `, { preheader: `Reset your Intern Flow password — this link expires in ${expiresIn}.` });

    const text = [
      `Hi ${name},`,
      '',
      `Password Reset Request`,
      '',
      `We received a request to reset the password for your Intern Flow account.`,
      '',
      `Reset your password here: ${resetUrl}`,
      '',
      `This link will expire in ${expiresIn}. It can only be used once.`,
      '',
      `IMPORTANT: If you did not request a password reset, please ignore this email. Your password will remain unchanged.`,
      '',
      ipAddress ? `Request Origin: ${ipAddress}` : '',
      '',
      `For security concerns, contact us immediately at support@internflow.io`,
      '',
      `Regards,`,
      `Intern Flow Account Security`,
    ].filter(l => l !== undefined && l !== '').join('\n');

    return { subject, text, html };
  },
};
