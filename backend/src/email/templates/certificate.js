module.exports = {
  render: (vars = {}) => {
    const name = vars.name || 'Recipient';
    const certificateLink = vars.certificateLink || '#';
    const subject = `Your Certificate is Ready`;
    const text = `Hi ${name},\n\nCongratulations — your certificate is ready. Download it here: ${certificateLink}`;
    const html = `<p>Hi ${name},</p><p>Congratulations — your certificate is ready. <a href="${certificateLink}">Download it here</a>.</p>`;
    return { subject, text, html };
  },
};
