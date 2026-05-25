const welcome = require('./welcome');
const ndaReminder = require('./ndaReminder');
const ndaStatusUpdate = require('./ndaStatusUpdate');
const escalation = require('./escalation');
const certificate = require('./certificate');
const referralReceived = require('./referralReceived');
const nonWorkerIdConfirmation = require('./nonWorkerIdConfirmation');
const nonWorkerIdApproved = require('./nonWorkerIdApproved');
const nonWorkerIdRejected = require('./nonWorkerIdRejected');
const accessProvisioningStarted = require('./accessProvisioningStarted');
const accessProvisioningCompleted = require('./accessProvisioningCompleted');
const onboardingUpdate = require('./onboardingUpdate');
const onboardingInitiation = require('./onboardingInitiation');
const onboardingInvitation = require('./onboardingInvitation');
const passwordReset = require('./passwordReset');
const slaWarning = require('./slaWarning');

module.exports = {
  welcome,
  ndaReminder,
  ndaStatusUpdate,
  escalation,
  certificate,
  referralReceived,
  nonWorkerIdConfirmation,
  nonWorkerIdApproved,
  nonWorkerIdRejected,
  accessProvisioningStarted,
  accessProvisioningCompleted,
  onboardingUpdate,
  onboardingInitiation,
  onboardingInvitation,
  passwordReset,
  slaWarning,
};
