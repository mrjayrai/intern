const { baseLayout, renderDetailsCard, renderNextSteps, renderStatusBadge, renderDivider, esc } = require('./layout');

module.exports = {
  render: (vars = {}) => {
    const name = vars.name || vars.candidateName || 'Candidate';
    const startDate = vars.startDate || new Date().toLocaleDateString();
    const hrContact = vars.hrContact || 'hr@internflow.io';
    const subject = `🎉 Your Internship is Now Live — Welcome to the Team, ${name}! | Intern Flow`;

    const detailRows = [
      ['Status', 'Active Internship'],
      ['Start Date', startDate],
      ['Portal', 'https://internflow.io/dashboard'],
    ];

    const html = baseLayout(`
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Internship Activation</p>

      <div style="margin-bottom:16px;">${renderStatusBadge('Active Internship', 'success')}</div>

      <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#0f172a;margin:0 0 8px 0;line-height:1.3;">🚀 Your Internship is Now Live!</h1>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:16px 0 0 0;">
        Hi <strong style="color:#0f172a;">${esc(name)}</strong>,
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        Congratulations! Your internship has been officially activated. You've completed all onboarding steps and are now an active member of the team. Welcome aboard!
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
        Your internship journey begins today. You now have full access to all systems, resources, and tools you'll need to succeed in your role.
      </p>

      ${renderDetailsCard(detailRows, 'Internship Details')}

      ${renderNextSteps([
        'Log in to your Intern Flow portal to view your internship dashboard and track progress.',
        'Check your corporate email for team introductions and project assignments.',
        'Review your internship goals and milestones with your mentor.',
        'Attend the new intern orientation session (check your calendar for details).',
        `Questions or need support? Contact HR at ${hrContact}.`,
      ])}

      ${renderDivider()}

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:0;">
        We're thrilled to have you on the team and can't wait to see what you'll accomplish during your internship. Make the most of this experience, ask questions, and enjoy the journey!
      </p>

      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:24px 0 0 0;">
        Welcome aboard,<br/>
        <strong style="color:#0f172a;">The Intern Flow Team</strong>
      </p>
    `, { preheader: `Your internship is now active! Welcome to the team and get ready to make an impact.` });

    const text = [
      `Hi ${name},`,
      '',
      `🚀 Your Internship is Now Live!`,
      '',
      `Congratulations! Your internship has been officially activated. You've completed all onboarding steps and are now an active member of the team. Welcome aboard!`,
      '',
      `Internship Details:`,
      `  Status: Active Internship`,
      `  Start Date: ${startDate}`,
      `  Portal: https://internflow.io/dashboard`,
      '',
      `Next Steps:`,
      `  1. Log in to your Intern Flow portal to view your dashboard.`,
      `  2. Check your corporate email for team introductions.`,
      `  3. Review your goals and milestones with your mentor.`,
      `  4. Attend the new intern orientation session.`,
      '',
      `Questions? Contact HR at ${hrContact}`,
      '',
      `We're thrilled to have you on the team!`,
      '',
      `Welcome aboard,`,
      `The Intern Flow Team`,
    ].join('\n');

    return { subject, text, html };
  },
};
