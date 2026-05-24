exports.render = ({ name = 'Candidate', ndaTitle = '', status = '', note = '', actionUrl = '' } = {}) => {
  const subject = `NDA Update: ${ndaTitle} - ${status}`;
  const text = `Hi ${name},\n\n` +
    `Your NDA "${ndaTitle}" is now ${status}.\n` +
    `${note ? `${note}\n` : ''}` +
    `${actionUrl ? `Document: ${actionUrl}\n` : ''}` +
    '\nThanks,\nThe Intern Flow Team';
  const html = `<p>Hi ${name},</p>` +
    `<p>Your NDA <strong>${ndaTitle}</strong> is now <strong>${status}</strong>.</p>` +
    (note ? `<p>${note}</p>` : '') +
    (actionUrl ? `<p>Document: <a href="${actionUrl}">${actionUrl}</a></p>` : '') +
    `<p>Thanks,<br/>The Intern Flow Team</p>`;

  return { subject, text, html };
};
