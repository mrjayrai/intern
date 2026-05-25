/**
 * Onboarding Invitation Email Template
 * Sent to approved candidates with secure onboarding activation link
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

    const subject = `🎉 Congratulations ${candidateName}! Your Application Has Been Approved`;

    const formattedStartDate = startDate
      ? new Date(startDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'To be confirmed';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 3px solid #2563eb;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .congratulations {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 30px;
    }
    .congratulations h1 {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .congratulations p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .details-card {
      background-color: #f8fafc;
      border-left: 4px solid #2563eb;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .details-card h3 {
      margin-top: 0;
      color: #1e293b;
      font-size: 18px;
    }
    .detail-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #475569;
      width: 150px;
    }
    .detail-value {
      color: #1e293b;
      flex: 1;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 30px 0;
      box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);
    }
    .cta-button:hover {
      background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
    }
    .steps {
      margin: 30px 0;
    }
    .step {
      display: flex;
      margin: 15px 0;
      align-items: flex-start;
    }
    .step-number {
      background-color: #2563eb;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 15px;
      flex-shrink: 0;
    }
    .step-content {
      flex: 1;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning strong {
      color: #92400e;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 14px;
    }
    .support {
      background-color: #f1f5f9;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎉 Intern Flow</div>
      <p style="margin: 0; color: #64748b;">Welcome to Your Internship Journey</p>
    </div>

    <div class="congratulations">
      <h1>Congratulations, ${candidateName}! 🎊</h1>
      <p>Your application has been approved! We're excited to have you join our team.</p>
    </div>

    <p style="font-size: 16px; line-height: 1.8;">
      We are pleased to inform you that you have been selected for the <strong>${department}</strong> internship program.
      Your application impressed our team, and we believe you'll be a great addition to our organization.
    </p>

    <div class="details-card">
      <h3>📋 Your Internship Details</h3>
      <div class="detail-row">
        <div class="detail-label">Department:</div>
        <div class="detail-value">${department}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Role:</div>
        <div class="detail-value">${role}</div>
      </div>
      ${internshipDuration ? `
      <div class="detail-row">
        <div class="detail-label">Duration:</div>
        <div class="detail-value">${internshipDuration}</div>
      </div>
      ` : ''}
      ${mentor ? `
      <div class="detail-row">
        <div class="detail-label">Mentor:</div>
        <div class="detail-value">${mentor}</div>
      </div>
      ` : ''}
      ${startDate ? `
      <div class="detail-row">
        <div class="detail-label">Start Date:</div>
        <div class="detail-value">${new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      ` : ''}
    </div>

    ${offerLetterAttached ? `
    <div class="warning">
      <strong>📎 Offer Letter Attached</strong><br>
      Please review the attached offer letter carefully. It contains important details about your internship terms and conditions.
    </div>
    ` : ''}

    <div style="text-align: center; margin: 40px 0;">
      <p style="font-size: 18px; margin-bottom: 20px; font-weight: 600; color: #1e293b;">
        Ready to get started? Activate your account now!
      </p>
      <a href="${activationLink}" class="cta-button" style="color:white>
        🚀 Activate Your Account
      </a>
    </div>

    <div class="steps" style="color: white;>
      <h3 style="color: white; margin-bottom: 20px;">📝 Next Steps:</h3>

      <div class="step">
        <div class="step-number">1</div>
        <div class="step-content">
          <strong>Activate Your Account</strong><br>
          Click the button above to create your secure password and activate your Intern Flow account.
        </div>
      </div>

      <div class="step">
        <div class="step-number">2</div>
        <div class="step-content">
          <strong>Complete Joining Forms</strong><br>
          Fill out required documentation including personal information, emergency contacts, and bank details.
        </div>
      </div>

      <div class="step">
        <div class="step-number">3</div>
        <div class="step-content">
          <strong>Sign NDA & Documents</strong><br>
          Review and digitally sign the Non-Disclosure Agreement and other necessary documents.
        </div>
      </div>

      <div class="step">
        <div class="step-number">4</div>
        <div class="step-content">
          <strong>Access Provisioning</strong><br>
          Receive your employee ID, system access credentials, and onboarding materials.
        </div>
      </div>

      <div class="step">
        <div class="step-number">5</div>
        <div class="step-content">
          <strong>Start Your Journey!</strong><br>
          Begin your internship and collaborate with your team on exciting projects.
        </div>
      </div>
    </div>

    <div class="warning">
      <strong>⏰ Important:</strong> This invitation link will expire in <strong>72 hours</strong>.
      Please activate your account as soon as possible to continue with your onboarding process.
    </div>

    <div class="support">
      <strong>Need Help?</strong><br>
      If you have any questions or face any issues, please contact our HR team at
      <a href="mailto:hr@internflow.com" style="color: #2563eb; text-decoration: none;">hr@internflow.com</a>
      or call us at <strong>+1 (555) 123-4567</strong>
    </div>

    <div class="footer">
      <p><strong>Intern Flow</strong> - Streamlining Your Internship Journey</p>
      <p style="margin-top: 10px; font-size: 12px;">
        This is an automated email. Please do not reply directly to this message.<br>
        If you did not apply for this position, please ignore this email or contact us immediately.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return { subject, html };
  },
};
