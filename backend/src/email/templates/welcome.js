const { baseLayout, renderButton, renderDetailsCard, renderNextSteps, renderStatusBadge, esc } = require('./layout');

module.exports = {
  render: (vars = {}) => {
    const name = vars.name || 'Candidate';
    const subject = `Welcome to Intern Flow — Let's Get Started, ${name}`;

    const html = baseLayout(`
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;margin:0 0 20px 0;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Getting Started</p>

      <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:700;color:#0f172a;margin:0 0 8px 0;line-height:1.3;">Welcome to Intern Flow, ${esc(name)}!</h1>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:16px 0 0 0;">
        You've successfully joined <strong style="color:#0f172a;">Intern Flow</strong> — the AI-powered platform for managing internship programs end to end. We're glad to have you on board.
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        Your account is ready. Sign in to complete your profile and explore the platform at your own pace.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
        <tr>
          <td style="padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-bottom:12px;">
                  <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;margin:0;">What's Available to You</p>
                </td>
              </tr>
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width:50%;vertical-align:top;padding-right:8px;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="font-size:16px;padding-right:8px;vertical-align:top;color:#3b82f6;">&#9679;</td>
                            <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#475569;line-height:1.5;padding-bottom:8px;">Onboarding &amp; document management</td>
                          </tr>
                          <tr>
                            <td style="font-size:16px;padding-right:8px;vertical-align:top;color:#3b82f6;">&#9679;</td>
                            <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#475569;line-height:1.5;">NDA signing &amp; compliance tracking</td>
                          </tr>
                        </table>
                      </td>
                      <td style="width:50%;vertical-align:top;padding-left:8px;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="font-size:16px;padding-right:8px;vertical-align:top;color:#8b5cf6;">&#9679;</td>
                            <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#475569;line-height:1.5;padding-bottom:8px;">Certificate issuance &amp; verification</td>
                          </tr>
                          <tr>
                            <td style="font-size:16px;padding-right:8px;vertical-align:top;color:#8b5cf6;">&#9679;</td>
                            <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#475569;line-height:1.5;">AI-powered workflow assistance</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
        <tr>
          <td>
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:0 0 20px 0;">
              If you have any questions or need assistance getting started, our support team is always here to help.
            </p>
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:0;">
              Warm regards,<br/>
              <strong style="color:#0f172a;">The Intern Flow Team</strong>
            </p>
          </td>
        </tr>
      </table>
    `, { preheader: `Welcome to Intern Flow, ${name}. Your account is ready — sign in to get started.` });

    const text = [
      `Welcome to Intern Flow, ${name}!`,
      '',
      `Your account is ready. You've successfully joined Intern Flow — the AI-powered platform for managing internship programs end to end.`,
      '',
      `Sign in to complete your profile, review your onboarding tasks, and explore the platform.`,
      '',
      `What's available:`,
      `  - Onboarding & document management`,
      `  - NDA signing & compliance tracking`,
      `  - Certificate issuance & verification`,
      `  - AI-powered workflow assistance`,
      '',
      `If you have questions, contact us at support@internflow.io`,
      '',
      `Warm regards,`,
      `The Intern Flow Team`,
    ].join('\n');

    return { subject, text, html };
  },
};
