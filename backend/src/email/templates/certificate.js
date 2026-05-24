const { baseLayout, renderButton, renderDetailsCard, renderNextSteps, renderStatusBadge, renderDivider, esc } = require('./layout');

module.exports = {
  render: (vars = {}) => {
    const name = vars.name || 'Recipient';
    const certificateLink = vars.certificateLink || '#';
    const verificationId = vars.verificationId || '';
    const subject = `Your Internship Certificate Is Ready — Congratulations, ${name}! | Intern Flow`;

    const detailRows = [
      ['Recipient', name],
      verificationId ? ['Verification ID', verificationId] : null,
      ['Issued By', 'Intern Flow Platform'],
      ['Certificate Status', 'Issued & Ready to Download'],
    ].filter(Boolean);

    const html = baseLayout(`
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Certificate Issuance</p>

      <div style="margin-bottom:16px;">${renderStatusBadge('Certificate Issued', 'success')}</div>

      <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:700;color:#0f172a;margin:0 0 8px 0;line-height:1.3;">Congratulations, ${esc(name)}!</h1>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:16px 0 0 0;">
        Your internship has been completed and your certificate has been officially issued. This certificate recognises your commitment, contribution, and professional development during your internship program.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        Your certificate is attached to this email and can also be downloaded directly from the Intern Flow platform at any time.
      </p>

      <!-- Certificate card -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;background:linear-gradient(135deg,#eff6ff,#f5f3ff);border:1px solid #bfdbfe;border-radius:10px;">
        <tr>
          <td align="center" style="padding:28px 24px;">
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:28px;margin:0 0 4px 0;">&#127942;</p>
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#1e3a5f;margin:0 0 6px 0;">Internship Certificate of Completion</p>
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#475569;margin:0 0 16px 0;">Issued to <strong>${esc(name)}</strong> via Intern Flow</p>
            ${verificationId ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#64748b;background-color:rgba(255,255,255,0.7);padding:5px 12px;border-radius:20px;display:inline-block;margin:0;letter-spacing:0.3px;">Verification ID: <strong>${esc(verificationId)}</strong></p>` : ''}
          </td>
        </tr>
      </table>

      ${renderButton('Download Your Certificate', certificateLink, { marginTop: '24px', marginBottom: '8px' })}

      ${renderDetailsCard(detailRows, 'Certificate Details')}

      ${renderNextSteps([
        'Download your certificate using the button above or the attachment in this email.',
        `To verify the authenticity of your certificate${verificationId ? `, use Verification ID: ${verificationId}` : ', use the Intern Flow portal'}.`,
        'Share your achievement on LinkedIn or your professional profile.',
      ])}

      ${renderDivider()}

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;line-height:1.6;margin:0;">
        Having trouble downloading your certificate? Contact us at <a href="mailto:support@internflow.io" style="color:#3b82f6;text-decoration:none;">support@internflow.io</a>.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:24px 0 0 0;">
        Warmly,<br/>
        <strong style="color:#0f172a;">The Intern Flow Team</strong>
      </p>
    `, { preheader: `Congratulations, ${name}! Your internship certificate is ready. Download it now.` });

    const text = [
      `Congratulations, ${name}!`,
      '',
      `Your Internship Certificate Is Ready`,
      '',
      `Your internship has been completed and your certificate has been officially issued. This certificate recognises your commitment, contribution, and professional development during your internship program.`,
      '',
      `Download your certificate: ${certificateLink}`,
      verificationId ? `\nVerification ID: ${verificationId}` : '',
      '',
      `Next Steps:`,
      `  1. Download your certificate using the link above.`,
      verificationId
        ? `  2. To verify authenticity, use Verification ID: ${verificationId}.`
        : `  2. Certificate authenticity can be verified via the Intern Flow portal.`,
      `  3. Share your achievement on LinkedIn or your professional profile.`,
      '',
      `Having trouble? Contact us at support@internflow.io`,
      '',
      `Warmly,`,
      `The Intern Flow Team`,
    ].filter(l => l !== undefined).join('\n');

    return { subject, text, html };
  },
};
