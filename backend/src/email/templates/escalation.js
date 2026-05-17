module.exports = {
  render: (vars = {}) => {
    const name = vars.name || 'Team';
    const referralId = vars.referralId || '';
    const subject = `Escalation: Action required for referral ${referralId}`;
    const text = `Hi ${name},\n\nThis is an escalation for referral ${referralId}. Please take immediate action.`;
    const html = `<p>Hi ${name},</p><p>This is an escalation for referral <strong>${referralId}</strong>. Please take immediate action.</p>`;
    return { subject, text, html };
  },
};
