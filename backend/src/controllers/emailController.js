const EmailLog = require('../models/EmailLog');
const emailService = require('../services/emailService');
const ApiError = require('../utils/apiError');

exports.listLogs = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const skip = (page - 1) * limit;
    const q = {};
    if (req.query.status) q.status = req.query.status;
    if (req.query.to) q.to = req.query.to;

    const [rows, total] = await Promise.all([
      EmailLog.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      EmailLog.countDocuments(q),
    ]);

    return res.status(200).json({ success: true, data: { rows, total, page, limit } });
  } catch (err) {
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
