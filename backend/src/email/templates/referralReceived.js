module.exports = {
  render: (vars = {}) => {
    const name = vars.name || 'Candidate';
    const referralId = vars.referralId || '';
    const subject = `Referral received: thank you for your submission`;
    const text = `Hi ${name},\n\nThank you for submitting your referral${referralId ? ` for referral ${referralId}` : ''}. We have received it and will begin processing it shortly.\n\nBest regards,\nIntern Flow Team`;
    const html = `<p>Hi ${name},</p><p>Thank you for submitting your referral${referralId ? ` for referral <strong>${referralId}</strong>` : ''}. We have received it and will begin processing it shortly.</p><p>Best regards,<br/>Intern Flow Team</p>`;
    return { subject, text, html };
  },
};
