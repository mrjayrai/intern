const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');
const templates = require('../email/templates');
const ApiError = require('../utils/apiError');

const DEFAULT_FROM = process.env.EMAIL_FROM || 'no-reply@internflow.local';
const MAX_RETRIES = parseInt(process.env.EMAIL_MAX_RETRIES, 10) || 3;
const RETRY_BACKOFF_MS = parseInt(process.env.EMAIL_RETRY_BACKOFF_MS, 10) || 2000;

let transporter;

const initTransporter = () => {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST || 'localhost';
  const port = parseInt(process.env.SMTP_PORT, 10) || 1025;
  const secure = process.env.SMTP_SECURE === 'true';
  const auth = process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined;

  transporter = nodemailer.createTransport({ host, port, secure, auth });
  return transporter;
};

const renderTemplate = (templateName, variables = {}) => {
  const tpl = templates[templateName];
  if (!tpl || typeof tpl.render !== 'function') {
    throw new ApiError(500, `Email template not found: ${templateName}`);
  }
  return tpl.render(variables);
};

const createLog = async ({ to, from, subject, template, variables, attachments = [] }) => {
  const log = new EmailLog({ to, from, subject, template, variables, attachments, status: 'queued' });
  return log.save();
};

const sendMailRaw = async (mailOptions) => {
  const t = initTransporter();
  return t.sendMail(mailOptions);
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const processLogSend = async (logId) => {
  const log = await EmailLog.findById(logId);
  if (!log) throw new ApiError(404, 'Email log not found');

  const mailOptions = {
    from: log.from || DEFAULT_FROM,
    to: log.to,
    subject: log.subject,
    text: log.variables && log.variables.text ? log.variables.text : undefined,
    html: log.variables && log.variables.html ? log.variables.html : undefined,
    attachments: log.attachments || [],
  };

  try {
    await EmailLog.findByIdAndUpdate(logId, { $inc: { attempts: 1 }, lastAttemptAt: new Date(), status: 'sending' });
    await sendMailRaw(mailOptions);
    await EmailLog.findByIdAndUpdate(logId, { status: 'sent', sentAt: new Date() });
    return true;
  } catch (err) {
    const updated = await EmailLog.findByIdAndUpdate(logId, { $inc: { attempts: 1 }, lastAttemptAt: new Date(), error: err.message }, { new: true });
    if (updated.attempts >= MAX_RETRIES) {
      await EmailLog.findByIdAndUpdate(logId, { status: 'failed' });
      return false;
    }
    // leave as queued for retry
    await delay(RETRY_BACKOFF_MS * updated.attempts);
    return processLogSend(logId);
  }
};

const sendTemplate = async (to, templateName, variables = {}, options = {}) => {
  const rendered = renderTemplate(templateName, variables);
  const log = await createLog({
    to,
    from: options.from || DEFAULT_FROM,
    subject: rendered.subject,
    template: templateName,
    variables: { ...variables, text: rendered.text, html: rendered.html },
    attachments: options.attachments || [],
  });

  if (options.enqueue === false) {
    // send immediately and return status
    await processLogSend(log._id);
    return EmailLog.findById(log._id);
  }

  // queued for background worker
  return log;
};

const enqueueEmail = async (to, templateName, variables = {}, options = {}) => {
  return sendTemplate(to, templateName, variables, Object.assign({}, options, { enqueue: true }));
};

const processQueue = async (limit = 20) => {
  const items = await EmailLog.find({ status: { $in: ['queued', 'failed'] }, attempts: { $lt: MAX_RETRIES } }).sort({ createdAt: 1 }).limit(limit);
  const results = [];
  for (const it of items) {
    // hydrate variables into mailOptions
    results.push({ id: it._id, ok: await processLogSend(it._id) });
  }
  return results;
};

module.exports = {
  initTransporter,
  sendTemplate,
  enqueueEmail,
  processQueue,
  renderTemplate,
};
