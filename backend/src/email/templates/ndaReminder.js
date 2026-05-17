module.exports = {
  render: (vars = {}) => {
    const name = vars.name || 'Candidate';
    const referralId = vars.referralId || '';
    const subject = `Reminder: Please sign your NDA`;
    const text = `Hi ${name},\n\nOur records show your NDA for referral ${referralId} is pending. Please sign it to continue onboarding.\n\nThanks.`;
    const html = `<p>Hi ${name},</p><p>Your NDA for referral <strong>${referralId}</strong> is pending. Please sign it to continue onboarding.</p><p>Thanks.</p>`;
    return { subject, text, html };
  },
};
