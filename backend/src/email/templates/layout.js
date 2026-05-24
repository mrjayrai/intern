/**
 * Shared email layout helpers.
 * All functions return inline-styled, email-client-safe HTML strings.
 */

const COLORS = {
  headerBg: '#0f172a',
  headerAccent: '#3b82f6',
  bodyBg: '#f1f5f9',
  cardBg: '#ffffff',
  border: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  ctaBtn: '#3b82f6',
  ctaBtnHover: '#2563eb',
  success: '#059669',
  successBg: '#ecfdf5',
  successBorder: '#a7f3d0',
  warning: '#d97706',
  warningBg: '#fffbeb',
  warningBorder: '#fde68a',
  error: '#dc2626',
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',
  info: '#2563eb',
  infoBg: '#eff6ff',
  infoBorder: '#bfdbfe',
  neutral: '#475569',
  neutralBg: '#f8fafc',
  neutralBorder: '#e2e8f0',
  footerBg: '#0f172a',
  footerText: '#94a3b8',
};

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHeader() {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.headerBg};">
    <tr>
      <td align="center" style="padding:0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding:28px 40px 24px 40px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);width:40px;height:40px;border-radius:10px;text-align:center;vertical-align:middle;font-size:20px;color:#ffffff;font-weight:bold;padding:0;" align="center">
                          &#10024;
                        </td>
                        <td style="padding-left:12px;vertical-align:middle;">
                          <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;line-height:1;">Intern Flow</div>
                          <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#64748b;letter-spacing:0.5px;margin-top:3px;line-height:1;">AI-POWERED INTERNSHIP PLATFORM</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function renderFooter() {
  const year = new Date().getFullYear();
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.footerBg};">
    <tr>
      <td align="center" style="padding:0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding:28px 40px 8px 40px;border-top:1px solid #1e293b;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#64748b;line-height:1.6;">
                    <strong style="color:#94a3b8;">Need help?</strong> Contact our support team at
                    <a href="mailto:support@internflow.io" style="color:#3b82f6;text-decoration:none;">support@internflow.io</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;border-top:1px solid #1e293b;margin-top:16px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#475569;line-height:1.5;">
                          &copy; ${year} Intern Flow. All rights reserved.
                        </td>
                        <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#475569;line-height:1.5;">
                          Powered by Intern Flow Platform
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;padding-bottom:20px;">
                    <p style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#334155;line-height:1.5;margin:0;">
                      <strong style="color:#475569;">Confidentiality Notice:</strong> This email and any attachments are intended solely for the named recipient(s) and may contain confidential or legally privileged information. If you have received this message in error, please notify the sender immediately and delete it. Unauthorized disclosure, copying, or distribution is strictly prohibited.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function renderButton(label, url, opts = {}) {
  const bg = opts.bg || COLORS.ctaBtn;
  const color = opts.color || '#ffffff';
  const safeUrl = esc(url);
  const safeLabel = esc(label);
  return `
  <table cellpadding="0" cellspacing="0" border="0" style="margin-top:${opts.marginTop || '8px'};margin-bottom:${opts.marginBottom || '0'};">
    <tr>
      <td align="${opts.align || 'left'}">
        <a href="${safeUrl}" target="_blank" style="display:inline-block;background-color:${bg};color:${color};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;letter-spacing:0.2px;">${safeLabel}</a>
      </td>
    </tr>
  </table>`;
}

function renderDetailRow(label, value) {
  if (!value) return '';
  return `
  <tr>
    <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${COLORS.textMuted};padding:7px 0;width:40%;vertical-align:top;border-bottom:1px solid #f1f5f9;">${esc(label)}</td>
    <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${COLORS.textPrimary};padding:7px 0 7px 12px;vertical-align:top;border-bottom:1px solid #f1f5f9;font-weight:500;">${esc(value)}</td>
  </tr>`;
}

function renderDetailsCard(rows, title) {
  const rowsHtml = rows.map(([label, value]) => renderDetailRow(label, value)).join('');
  if (!rowsHtml.trim()) return '';
  const titleHtml = title
    ? `<tr><td colspan="2" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:0.8px;padding-bottom:10px;">${esc(title)}</td></tr>`
    : '';
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid ${COLORS.border};border-radius:8px;margin-top:20px;margin-bottom:8px;">
    <tr>
      <td style="padding:18px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${titleHtml}
          ${rowsHtml}
        </table>
      </td>
    </tr>
  </table>`;
}

function renderStatusBadge(label, type) {
  const map = {
    success: { bg: COLORS.successBg, color: COLORS.success, border: COLORS.successBorder },
    warning: { bg: COLORS.warningBg, color: COLORS.warning, border: COLORS.warningBorder },
    error:   { bg: COLORS.errorBg,   color: COLORS.error,   border: COLORS.errorBorder   },
    info:    { bg: COLORS.infoBg,    color: COLORS.info,    border: COLORS.infoBorder    },
    neutral: { bg: COLORS.neutralBg, color: COLORS.neutral, border: COLORS.neutralBorder },
  };
  const style = map[type] || map.neutral;
  return `<span style="display:inline-block;background-color:${style.bg};color:${style.color};border:1px solid ${style.border};font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:0.6px;text-transform:uppercase;">${esc(label)}</span>`;
}

function renderNextSteps(steps) {
  if (!steps || !steps.length) return '';
  const items = steps
    .map((step, i) => `
    <tr>
      <td style="padding:6px 0;vertical-align:top;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background-color:#3b82f6;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;width:22px;height:22px;border-radius:50%;text-align:center;vertical-align:middle;padding:0;" align="center">${i + 1}</td>
            <td style="padding-left:10px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${COLORS.textSecondary};vertical-align:middle;">${esc(step)}</td>
          </tr>
        </table>
      </td>
    </tr>`)
    .join('');
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
    <tr>
      <td>
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:0.8px;margin:0 0 10px 0;">Next Steps</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${items}
        </table>
      </td>
    </tr>
  </table>`;
}

function renderAlertBanner(message, type) {
  const map = {
    warning: { bg: COLORS.warningBg, border: COLORS.warningBorder, color: COLORS.warning, icon: '&#9888;' },
    error:   { bg: COLORS.errorBg,   border: COLORS.errorBorder,   color: COLORS.error,   icon: '&#10005;' },
    info:    { bg: COLORS.infoBg,    border: COLORS.infoBorder,    color: COLORS.info,    icon: '&#8505;'  },
  };
  const s = map[type] || map.info;
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;margin-bottom:4px;">
    <tr>
      <td style="background-color:${s.bg};border:1px solid ${s.border};border-radius:8px;padding:12px 16px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size:16px;color:${s.color};vertical-align:top;padding-right:10px;">${s.icon}</td>
            <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${s.color};line-height:1.5;">${esc(message)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function renderDivider() {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;"><tr><td style="border-top:1px solid ${COLORS.border};height:1px;font-size:1px;line-height:1px;">&nbsp;</td></tr></table>`;
}

/**
 * Wraps content in the full email shell (header + white card + footer).
 * @param {string} content - Inner HTML for the card body
 * @param {object} opts
 * @param {string} opts.preheader - Short preview text shown in inbox
 */
function baseLayout(content, opts = {}) {
  const preheader = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:transparent;">${esc(opts.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Intern Flow</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.bodyBg};-webkit-font-smoothing:antialiased;">
  ${preheader}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.bodyBg};min-width:320px;">
    <tr>
      <td align="center" style="padding:0;">

        ${renderHeader()}

        <!-- Main card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:${COLORS.cardBg};">
          <tr>
            <td style="padding:36px 40px 32px 40px;">
              ${content}
            </td>
          </tr>
        </table>

        <!-- Spacer -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:${COLORS.cardBg};">
          <tr><td style="height:1px;background-color:${COLORS.border};font-size:1px;line-height:1px;">&nbsp;</td></tr>
        </table>

        ${renderFooter()}

      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = {
  baseLayout,
  renderHeader,
  renderFooter,
  renderButton,
  renderDetailRow,
  renderDetailsCard,
  renderStatusBadge,
  renderNextSteps,
  renderAlertBanner,
  renderDivider,
  esc,
};
