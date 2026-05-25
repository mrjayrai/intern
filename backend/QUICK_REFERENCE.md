# Intern Flow - Quick Reference Guide

## 🔍 Monitoring Commands

### Check Email Queue Status
```bash
curl http://localhost:5000/api/emails/queue-status
```

### View Recent Failed Emails
```bash
curl "http://localhost:5000/api/emails/logs?status=failed&limit=20"
```

### Monitor Security Alerts
```bash
tail -f logs/app.log | grep "SECURITY ALERT"
```

### Watch Workflow Transitions
```bash
tail -f logs/app.log | grep "Workflow"
```

### Monitor Email Queue
```bash
tail -f logs/app.log | grep "EmailQueue"
```

---

## 🛠️ Common Operations

### Retry Failed Email
```javascript
// PUT /api/emails/:id/retry
const response = await fetch(`/api/emails/${emailId}/retry`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Check Queue Processing Status
```javascript
const status = await emailService.getQueueStatus();
console.log('Is Processing:', status.processing.isProcessing);
console.log('Queued:', status.queue.queued);
console.log('Failed:', status.queue.failed);
```

### Validate File Upload
```javascript
const { createUploadValidator } = require('./middleware/uploadValidation');

// In route
router.post('/upload',
  upload.single('file'),
  createUploadValidator('resume'), // or 'nda', 'onboarding', 'certificate'
  controller.handleUpload
);
```

---

## 🔒 Security Logging

### Log Security Event
```javascript
const securityLogger = require('./utils/securityLogger');

// Unauthorized access
securityLogger.logUnauthorizedAccess(req.user, '/api/certificates/123', 'view');

// Invalid ownership
securityLogger.logInvalidOwnership(req.user, 'Certificate', certId, ownerId);

// Invalid upload
securityLogger.logInvalidUpload(req.user, file.originalname, 'resume', errors);

// Token failure
securityLogger.logTokenFailure(token, 'expired', req.ip);
```

---

## 📊 Key Metrics to Watch

### Email Queue Health
- **Queued**: Should be < 50 under normal load
- **Failed**: Should be < 1% of total
- **Processing**: Should complete within 2 minutes
- **Retrying**: Should resolve within 3 attempts

### Workflow Metrics
- **Transition Success Rate**: Should be > 99%
- **Duplicate Transitions**: Should be 0 per day
- **Invalid Transitions**: Should be 0 per day

### Security Metrics
- **Unauthorized Access**: Should investigate any spike
- **Invalid Uploads**: Track attempted malicious uploads
- **Token Failures**: Monitor for brute force attempts

---

## 🐛 Troubleshooting

### Email Queue Stuck
```javascript
// Check queue status
const status = await emailService.getQueueStatus();

// If stuck in 'sending' for > 5 minutes, manually reset
await EmailLog.updateMany(
  { status: 'sending', lastAttemptAt: { $lt: new Date(Date.now() - 300000) } },
  { status: 'queued' }
);

// Trigger processing
emailService.processQueue(50);
```

### Duplicate Workflow Transitions
```bash
# Check logs for duplicate prevention
grep "Duplicate transition prevented" logs/app.log
```

### Certificate Email Not Sent
```javascript
// Check email log
const log = await EmailLog.findOne({ 
  to: 'candidate@example.com',
  template: 'certificate'
}).sort({ createdAt: -1 });

console.log('Status:', log.status);
console.log('Attempts:', log.attempts);
console.log('Error:', log.error);
```

---

## 📁 File Locations

### Core Services
- `backend/src/services/workflowService.js` - Workflow transitions
- `backend/src/services/emailService.js` - Email queue
- `backend/src/services/certificateService.js` - Certificate issuance
- `backend/src/services/referralService.js` - Referral workflow

### Security
- `backend/src/middleware/uploadValidation.js` - File upload security
- `backend/src/utils/securityLogger.js` - Security event logging

### Controllers
- `backend/src/controllers/emailController.js` - Email queue endpoints
- `backend/src/controllers/certificateController.js` - Certificate endpoints
- `backend/src/controllers/trackingController.js` - Activity tracking

### Documentation
- `backend/HARDENING_SUMMARY.md` - Detailed hardening changes
- `backend/PRODUCTION_READINESS.md` - Deployment checklist
- `backend/QUICK_REFERENCE.md` - This guide

---

## 🚀 Deployment Quick Start

```bash
# 1. Verify environment
npm run check-env

# 2. Run tests
npm test

# 3. Start application
npm start

# 4. Verify health
curl http://localhost:5000/health

# 5. Check email queue
curl http://localhost:5000/api/emails/queue-status
```

---

## 📞 Support Contacts

| Issue Type | Contact | Response Time |
|------------|---------|---------------|
| Production outage | On-call engineer | Immediate |
| Security incident | Security team | < 15 minutes |
| Email queue issues | DevOps team | < 30 minutes |
| Data integrity | Backend lead | < 1 hour |

---

**Last Updated**: 2026-05-25  
**Version**: 1.0.0  
**Status**: Production Ready ✅
