const EmailLog = require('../models/EmailLog');
const emailService = require('../services/emailService');
const ApiError = require('../utils/apiError');

exports.listLogs = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      to: req.query.to,
      template: req.query.template
    };
    const options = {
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await emailService.getEmailLogs(filters, options);
    console.log(`[EmailQueue] Email logs requested | Page: ${result.meta.page} | Total: ${result.meta.total}`);

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('[EmailQueue] Failed to list email logs:', err?.message || err);
    return next(new ApiError(500, 'Failed to list email logs'));
  }
};

exports.retryLog = async (req, res, next) => {
  try {
    const id = req.params.id;
    const log = await EmailLog.findById(id);
    if (!log) return next(new ApiError(404, 'Email log not found'));
    log.status = 'queued';
    log.attempts = 0;
    log.error = undefined;
    await log.save();

    // trigger immediate processing of this log (non-blocking)
    emailService.processQueue(10).catch(console.error);

    return res.status(200).json({ success: true, data: log });
  } catch (err) {
    return next(new ApiError(500, 'Failed to retry email log'));
  }
};

exports.queueStatus = async (req, res, next) => {
  try {
    const status = await emailService.getQueueStatus();
    console.log('[EmailQueue] Status requested:', JSON.stringify(status.queue));
    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (err) {
    console.error('[EmailQueue] Failed to get queue status:', err?.message || err);
    return next(new ApiError(500, 'Failed to get queue status'));
  }
};

exports.sendTest = async (req, res, next) => {
  try {
    const to = req.body.to;
    if (!to) return next(new ApiError(400, 'to is required'));
    const log = await emailService.sendTemplate(to, 'welcome', { name: req.body.name || 'Test' }, { enqueue: false });
    return res.status(200).json({ success: true, data: log });
  } catch (err) {
    return next(err);
  }
};
