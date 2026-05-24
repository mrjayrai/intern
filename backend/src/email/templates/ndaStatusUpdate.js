const { baseLayout, renderButton, renderDetailsCard, renderNextSteps, renderStatusBadge, renderAlertBanner, renderDivider, esc } = require('./layout');

const STATUS_CONFIG = {
  DRAFT: {
    badgeLabel: 'Draft',
    badgeType: 'neutral',
    subjectPrefix: 'NDA Draft Saved',
    headline: 'Your NDA Document Has Been Saved as a Draft',
    intro: 'A draft NDA document has been created for your review. No action is required at this time.',
    alertType: null,
    nextSteps: null,
    ctaLabel: null,
  },
  PENDING_SIGNATURE: {
    badgeLabel: 'Action Required',
    badgeType: 'warning',
    subjectPrefix: 'Action Required: Please Sign Your NDA',
    headline: 'Your NDA Is Ready for Your Signature',
    intro: 'An NDA document has been prepared for you and requires your electronic signature before onboarding can proceed. Please review and sign at your earliest convenience.',
    alertType: 'warning',
    alertMessage: 'This document requires your signature before onboarding can continue. Please sign within the timeframe specified.',
    nextSteps: [
      'Open the NDA document using the button below.',
      'Read the agreement carefully in its entirety.',
      'Sign electronically using your full legal name.',
    ],
    ctaLabel: 'Review & Sign NDA',
  },
  SIGNED: {
    badgeLabel: 'Signed',
    badgeType: 'info',
    subjectPrefix: 'NDA Signed Successfully',
    headline: 'Your NDA Has Been Signed',
    intro: 'Thank you — your NDA has been successfully signed and submitted for review. Our compliance team will verify and approve the document shortly.',
    alertType: null,
    nextSteps: [
      'Your signature has been recorded and timestamped.',
      'Our compliance team will review and approve the document.',
      'You\'ll receive a confirmation email once the NDA is fully approved.',
    ],
    ctaLabel: 'View Document',
  },
  APPROVED: {
    badgeLabel: 'Approved',
    badgeType: 'success',
    subjectPrefix: 'Your NDA Has Been Approved',
    headline: 'NDA Approved — You\'re All Set',
    intro: 'Great news! Your NDA has been reviewed and officially approved by our compliance team. You may now proceed with the next stages of your onboarding.',
    alertType: null,
    nextSteps: [
      'Your NDA is now on file and valid.',
      'You may continue with the remaining onboarding steps.',
      'A signed copy can be downloaded from the Intern Flow portal.',
    ],
    ctaLabel: 'Continue Onboarding',
  },
  REJECTED: {
    badgeLabel: 'Rejected',
    badgeType: 'error',
    subjectPrefix: 'NDA Review Update — Action May Be Required',
    headline: 'Your NDA Could Not Be Approved',
    intro: 'Unfortunately, your NDA submission has been reviewed and could not be approved at this time. Please review any notes provided below and contact your HR representative to understand the next steps.',
    alertType: 'error',
    alertMessage: 'Your NDA was not approved. Please contact your recruiter or HR representative for guidance on how to proceed.',
    nextSteps: [
      'Review the rejection notes provided below (if any).',
      'Contact your HR representative for clarification.',
      'A revised NDA submission may be required — your HR contact will advise.',
    ],
    ctaLabel: 'Contact HR',
  },
  EXPIRED: {
    badgeLabel: 'Expired',
    badgeType: 'warning',
    subjectPrefix: 'Important: Your NDA Has Expired',
    headline: 'Your NDA Has Expired',
    intro: 'Your NDA document has passed its expiration date and is no longer valid. Please contact your HR representative to arrange a renewal as soon as possible to avoid delays to your onboarding.',
    alertType: 'warning',
    alertMessage: 'Expired NDAs must be renewed before onboarding can continue. Please act promptly to avoid workflow delays.',
    nextSteps: [
      'Contact your HR representative to initiate an NDA renewal.',
      'A new NDA will be issued for your review and signature.',
      'Respond promptly to avoid delays to your internship start date.',
    ],
    ctaLabel: null,
  },
  ARCHIVED: {
    badgeLabel: 'Archived',
    badgeType: 'neutral',
    subjectPrefix: 'NDA Archived',
    headline: 'Your NDA Has Been Archived',
    intro: 'This NDA document has been archived and is no longer active. If you believe this was done in error, please contact your HR representative.',
    alertType: null,
    nextSteps: null,
    ctaLabel: null,
  },
};

exports.render = ({ name = 'Candidate', ndaTitle = '', status = '', note = '', actionUrl = '' } = {}) => {
  const cfg = STATUS_CONFIG[status] || {
    badgeLabel: status || 'Updated',
    badgeType: 'neutral',
    subjectPrefix: `NDA Status Update: ${status}`,
    headline: `Your NDA Status Has Been Updated`,
    intro: `Your NDA "${ndaTitle}" has been updated to status: ${status}.`,
    alertType: null,
    nextSteps: null,
    ctaLabel: actionUrl ? 'View Document' : null,
  };

  const subject = `${cfg.subjectPrefix} — ${ndaTitle} | Intern Flow`;

  const noteBlock = note
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
        <tr>
          <td style="background-color:#f8fafc;border-left:3px solid #3b82f6;padding:12px 16px;border-radius:0 6px 6px 0;">
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#475569;line-height:1.6;margin:0;">${esc(note)}</p>
          </td>
        </tr>
      </table>`
    : '';

  const alertBlock = cfg.alertType && cfg.alertMessage
    ? renderAlertBanner(cfg.alertMessage, cfg.alertType)
    : '';

  const ctaBlock = cfg.ctaLabel && actionUrl
    ? renderButton(cfg.ctaLabel, actionUrl, { marginTop: '24px', marginBottom: '8px' })
    : '';

  const nextStepsBlock = cfg.nextSteps
    ? renderNextSteps(cfg.nextSteps)
    : '';

  const detailRows = [
    ['Document', ndaTitle],
    ['Status', cfg.badgeLabel],
    ['Reference', status],
  ].filter(([, v]) => v);

  const html = baseLayout(`
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">NDA &amp; Document Management</p>

    <div style="margin-bottom:16px;">${renderStatusBadge(cfg.badgeLabel, cfg.badgeType)}</div>

    <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#0f172a;margin:0 0 8px 0;line-height:1.3;">${cfg.headline}</h1>

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:16px 0 0 0;">
      Hi <strong style="color:#0f172a;">${esc(name)}</strong>,
    </p>

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:12px 0 0 0;">
      ${esc(cfg.intro)}
    </p>

    ${alertBlock}

    ${renderDetailsCard(detailRows, 'Document Details')}

    ${noteBlock}

    ${nextStepsBlock}

    ${ctaBlock}

    ${renderDivider()}

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;line-height:1.6;margin:0;">
      Questions about this NDA? Contact us at <a href="mailto:support@internflow.io" style="color:#3b82f6;text-decoration:none;">support@internflow.io</a>.
    </p>

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;margin:24px 0 0 0;">
      Regards,<br/>
      <strong style="color:#0f172a;">The Intern Flow Compliance Team</strong>
    </p>
  `, { preheader: `${cfg.badgeLabel}: ${ndaTitle} — ${cfg.intro.slice(0, 80)}` });

  const textLines = [
    `Hi ${name},`,
    '',
    `${cfg.headline}`,
    '',
    cfg.intro,
    '',
    ndaTitle ? `Document: ${ndaTitle}` : '',
    `Status: ${status}`,
    note ? `\nNote: ${note}` : '',
    actionUrl ? `\nDocument Link: ${actionUrl}` : '',
  ];

  if (cfg.nextSteps) {
    textLines.push('', 'Next Steps:');
    cfg.nextSteps.forEach((step, i) => textLines.push(`  ${i + 1}. ${step}`));
  }

  textLines.push('', 'Questions? Contact us at support@internflow.io', '', 'Regards,', 'The Intern Flow Compliance Team');

  const text = textLines.filter(l => l !== undefined).join('\n');

  return { subject, text, html };
};
