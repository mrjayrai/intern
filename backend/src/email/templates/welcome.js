module.exports = {
  render: (vars = {}) => {
    const name = vars.name || 'Candidate';
    const subject = `Welcome to Intern Flow, ${name}`;
    const text = `Hi ${name},\n\nWelcome to Intern Flow. We're excited to have you onboard.\n\nRegards,\nThe Team`;
    const html = `<p>Hi ${name},</p><p>Welcome to <strong>Intern Flow</strong>. We're excited to have you onboard.</p><p>Regards,<br/>The Team</p>`;
    return { subject, text, html };
  },
};
