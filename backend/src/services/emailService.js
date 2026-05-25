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
  if (!log) {
    console.error(`[EmailQueue] Email log not found: ${logId}`);
    throw new ApiError(404, 'Email log not found');
  }

  // Idempotency guard: skip if already sent
  if (log.status === 'sent') {
    console.log(`[EmailQueue] Email ${logId} already sent, skipping`);
    return true;
  }

  // Guard: skip if already sending (race condition prevention)
  if (log.status === 'sending') {
    console.log(`[EmailQueue] Email ${logId} already being sent, skipping`);
    return false;
  }

  const mailOptions = {
    from: log.from || DEFAULT_FROM,
    to: log.to,
    subject: log.subject,
    text: log.variables && log.variables.text ? log.variables.text : undefined,
    html: log.variables && log.variables.html ? log.variables.html : undefined,
    attachments: log.attachments || [],
  };

  // Increment attempts exactly once per send attempt
  const sending = await EmailLog.findByIdAndUpdate(
    logId,
    { $inc: { attempts: 1 }, lastAttemptAt: new Date(), status: 'sending' },
    { new: true },
  );

  if (!sending) {
    console.error(`[EmailQueue] Failed to update email log: ${logId}`);
    throw new ApiError(500, 'Failed to update email log');
  }

  console.log(`[EmailQueue] Sending email ${logId} | Attempt ${sending.attempts}/${MAX_RETRIES} | To: ${log.to}`);

  try {
    await sendMailRaw(mailOptions);
    await EmailLog.findByIdAndUpdate(logId, { status: 'sent', sentAt: new Date() });
    console.log(`[EmailQueue] Email sent successfully: ${logId}`);
    return true;
  } catch (err) {
    const isFinal = sending.attempts >= MAX_RETRIES;
    await EmailLog.findByIdAndUpdate(logId, { error: err.message, status: isFinal ? 'failed' : 'queued' });
    console.error(`[EmailQueue] Email send failed: ${logId} | Attempt ${sending.attempts}/${MAX_RETRIES} | Error: ${err.message}`);

    if (isFinal) {
      console.error(`[EmailQueue] Email permanently failed after ${MAX_RETRIES} attempts: ${logId}`);
      return false;
    }

    // Exponential backoff before retry
    const backoffMs = RETRY_BACKOFF_MS * sending.attempts;
    console.log(`[EmailQueue] Retrying email ${logId} after ${backoffMs}ms backoff`);
    await delay(backoffMs);
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

// Queue processing lock to prevent overlapping execution
let isProcessingQueue = false;
let lastQueueProcessTime = null;

const processQueue = async (limit = 20) => {
  // Prevent overlapping queue execution
  if (isProcessingQueue) {
    console.log('[EmailQueue] Queue processing already in progress, skipping');
    return { skipped: true, reason: 'already_processing' };
  }

  try {
    isProcessingQueue = true;
    lastQueueProcessTime = new Date();
    console.log(`[EmailQueue] Starting queue processing (limit: ${limit})`);

    // Only process 'queued' items (not 'failed' - failed is terminal)
    const items = await EmailLog.find({
      status: 'queued',
      attempts: { $lt: MAX_RETRIES }
    }).sort({ createdAt: 1 }).limit(limit);

    console.log(`[EmailQueue] Found ${items.length} queued emails to process`);

    const results = [];
    for (const it of items) {
      const startTime = Date.now();
      const ok = await processLogSend(it._id);
      const duration = Date.now() - startTime;
      results.push({ id: it._id, ok, duration });
      console.log(`[EmailQueue] Processed email ${it._id} | Success: ${ok} | Duration: ${duration}ms`);
    }

    console.log(`[EmailQueue] Queue processing completed | Processed: ${results.length} | Success: ${results.filter(r => r.ok).length}`);
    return { results, processed: results.length, succeeded: results.filter(r => r.ok).length };
  } catch (err) {
    console.error('[EmailQueue] Queue processing error:', err?.message || err);
    throw err;
  } finally {
    isProcessingQueue = false;
  }
};

/**
 * Get queue status and metrics
 */
const getQueueStatus = async () => {
  const [queued, sending, sent, failed, total] = await Promise.all([
    EmailLog.countDocuments({ status: 'queued' }),
    EmailLog.countDocuments({ status: 'sending' }),
    EmailLog.countDocuments({ status: 'sent' }),
    EmailLog.countDocuments({ status: 'failed' }),
    EmailLog.countDocuments({}),
  ]);

  // Get retry metrics
  const retrying = await EmailLog.countDocuments({ status: 'queued', attempts: { $gt: 0, $lt: MAX_RETRIES } });

  // Get recent failures
  const recentFailures = await EmailLog.find({ status: 'failed' })
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('to subject error attempts updatedAt')
    .lean();

  return {
    queue: {
      queued,
      sending,
      sent,
      failed,
      retrying,
      total
    },
    processing: {
      isProcessing: isProcessingQueue,
      lastProcessTime: lastQueueProcessTime
    },
    recentFailures,
    config: {
      maxRetries: MAX_RETRIES,
      retryBackoffMs: RETRY_BACKOFF_MS
    }
  };
};

/**
 * Get email logs with filtering
 */
const getEmailLogs = async (filters = {}, options = {}) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.to) query.to = new RegExp(filters.to, 'i');
  if (filters.template) query.template = filters.template;

  const page = Math.max(parseInt(options.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(options.limit, 10) || 50, 1), 200);
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    EmailLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-variables.html -variables.text')
      .lean(),
    EmailLog.countDocuments(query)
  ]);

  return {
    data: logs,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  initTransporter,
  sendTemplate,
  enqueueEmail,
  processQueue,
  renderTemplate,
  getQueueStatus,
  getEmailLogs,
};
