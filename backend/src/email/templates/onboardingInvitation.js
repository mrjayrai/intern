/**
 * Onboarding Invitation Email Template
 * Sent to approved candidates with secure onboarding activation link
 *
 * ENTERPRISE-GRADE DESIGN:
 * - High contrast for readability
 * - Email-client-safe inline styles
 * - Dark mode compatible
 * - Professional blue/white palette
 */

const { baseLayout, renderButton, esc } = require('./layout');

module.exports = {
  render: (vars = {}) => {
    const {
      candidateName = 'Candidate',
      department = 'Your Department',
      role = 'CANDIDATE',
      internshipDuration = 'TBD',
      mentor = 'Your Mentor',
      startDate,
      activationLink = '#',
      offerLetterAttached = true,
    } = vars;

    const subject = `🎉 Congratulations ${esc(candidateName)}! Your Application Has Been Approved`;

    const formattedStartDate = startDate
      ? new Date(startDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'To be confirmed';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Intern Flow - Onboarding Invitation</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!-- Preview text (hidden from display) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:transparent;">
    Congratulations! Your application has been approved. Activate your account to begin your internship journey.
  </div>

  <!-- Full-width wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;min-width:320px;">
    <tr>
      <td align="center" style="padding:20px 0;">

        <!-- Main container (600px) -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.07);">

          <!-- Header with gradient -->
          <tr>
            <td style="background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <h1 style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:36px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">
                      🎉 Congratulations!
                    </h1>
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#ffffff;opacity:0.95;line-height:1.5;">
                      ${esc(candidateName)}, your application has been approved
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:40px 40px 20px 40px;">

              <!-- Welcome message -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom:24px;">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#1e293b;line-height:1.7;">
                      We are thrilled to inform you that you have been selected for the <strong style="color:#2563eb;">${esc(department)}</strong> internship program.
                      Your application impressed our team, and we believe you'll be a valuable addition to our organization.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Internship details card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:2px solid #e2e8f0;border-left:4px solid #2563eb;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;">
                    <h3 style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#0f172a;letter-spacing:-0.2px;">
                      📋 Your Internship Details
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:10px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;font-weight:600;width:35%;vertical-align:top;">
                          Department:
                        </td>
                        <td style="padding:10px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;font-weight:500;vertical-align:top;">
                          ${esc(department)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;border-top:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;font-weight:600;vertical-align:top;">
                          Role:
                        </td>
                        <td style="padding:10px 0;border-top:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;font-weight:500;vertical-align:top;">
                          ${esc(role)}
                        </td>
                      </tr>
                      ${internshipDuration ? `
                      <tr>
                        <td style="padding:10px 0;border-top:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;font-weight:600;vertical-align:top;">
                          Duration:
                        </td>
                        <td style="padding:10px 0;border-top:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;font-weight:500;vertical-align:top;">
                          ${esc(internshipDuration)}
                        </td>
                      </tr>
                      ` : ''}
                      ${mentor ? `
                      <tr>
                        <td style="padding:10px 0;border-top:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;font-weight:600;vertical-align:top;">
                          Mentor:
                        </td>
                        <td style="padding:10px 0;border-top:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;font-weight:500;vertical-align:top;">
                          ${esc(mentor)}
                        </td>
                      </tr>
                      ` : ''}
                      ${startDate ? `
                      <tr>
                        <td style="padding:10px 0;border-top:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;font-weight:600;vertical-align:top;">
                          Start Date:
                        </td>
                        <td style="padding:10px 0;border-top:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;font-weight:500;vertical-align:top;">
                          ${esc(formattedStartDate)}
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              ${offerLetterAttached ? `
              <!-- Offer letter notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffbeb;border:2px solid #fde68a;border-left:4px solid #f59e0b;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#92400e;line-height:1.6;">
                      <strong style="font-size:15px;">📎 Offer Letter Attached</strong><br>
                      Please review the attached offer letter carefully. It contains important details about your internship terms and conditions.
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- CTA Section -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 36px 0;">
                <tr>
                  <td align="center" style="padding:20px;background-color:#eff6ff;border-radius:8px;border:2px solid #bfdbfe;">
                    <p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:600;color:#1e40af;line-height:1.4;">
                      Ready to get started? Activate your account now!
                    </p>
                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border-radius:8px;background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);box-shadow:0 4px 6px rgba(37,99,235,0.3);">
                          <a href="${esc(activationLink)}" target="_blank" style="display:inline-block;padding:16px 48px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
                            🚀 Activate Your Account
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Next Steps Section -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;margin-bottom:28px;">
                <tr>
                  <td>
                    <h3 style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;">
                      📝 Next Steps
                    </h3>

                    <!-- Step 1 -->
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;">
                      <tr>
                        <td style="vertical-align:top;width:36px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td align="center" style="width:32px;height:32px;border-radius:50%;background-color:#2563eb;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;line-height:32px;">
                                1
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6;">
                            <strong style="color:#1e293b;">Activate Your Account</strong><br>
                            <span style="color:#475569;">Click the button above to create your secure password and activate your Intern Flow account.</span>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Step 2 -->
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;">
                      <tr>
                        <td style="vertical-align:top;width:36px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td align="center" style="width:32px;height:32px;border-radius:50%;background-color:#2563eb;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;line-height:32px;">
                                2
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6;">
                            <strong style="color:#1e293b;">Complete Joining Forms</strong><br>
                            <span style="color:#475569;">Fill out required documentation including personal information, emergency contacts, and bank details.</span>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Step 3 -->
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;">
                      <tr>
                        <td style="vertical-align:top;width:36px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td align="center" style="width:32px;height:32px;border-radius:50%;background-color:#2563eb;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;line-height:32px;">
                                3
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6;">
                            <strong style="color:#1e293b;">Sign NDA & Documents</strong><br>
                            <span style="color:#475569;">Review and digitally sign the Non-Disclosure Agreement and other necessary documents.</span>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Step 4 -->
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;">
                      <tr>
                        <td style="vertical-align:top;width:36px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td align="center" style="width:32px;height:32px;border-radius:50%;background-color:#2563eb;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;line-height:32px;">
                                4
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6;">
                            <strong style="color:#1e293b;">Access Provisioning</strong><br>
                            <span style="color:#475569;">Receive your employee ID, system access credentials, and onboarding materials.</span>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Step 5 -->
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="vertical-align:top;width:36px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td align="center" style="width:32px;height:32px;border-radius:50%;background-color:#2563eb;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;line-height:32px;">
                                5
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6;">
                            <strong style="color:#1e293b;">Start Your Journey!</strong><br>
                            <span style="color:#475569;">Begin your internship and collaborate with your team on exciting projects.</span>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Expiration warning -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fef3c7;border:2px solid #fde68a;border-left:4px solid #f59e0b;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#92400e;line-height:1.6;">
                      <strong style="font-size:15px;">⏰ Important:</strong> This invitation link will expire in <strong>72 hours</strong>.
                      Please activate your account as soon as possible to continue with your onboarding process.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Support section -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;border-radius:8px;margin-top:32px;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#0f172a;">
                      Need Help?
                    </p>
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#475569;line-height:1.6;">
                      If you have any questions or face any issues, please contact our HR team at<br>
                      <a href="mailto:hr@internflow.com" style="color:#2563eb;text-decoration:none;font-weight:600;">hr@internflow.com</a>
                      or call us at <strong style="color:#0f172a;">+1 (555) 123-4567</strong>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px 40px;border-top:1px solid #e2e8f0;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#0f172a;">
                      Intern Flow
                    </p>
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#64748b;line-height:1.6;">
                      Streamlining Your Internship Journey
                    </p>
                    <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#94a3b8;line-height:1.5;">
                      This is an automated email. Please do not reply directly to this message.<br>
                      If you did not apply for this position, please ignore this email or contact us immediately.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- End main container -->

      </td>
    </tr>
  </table>
  <!-- End wrapper -->

</body>
</html>
    `.trim();

    return { subject, html };
  },
};
