const welcome = require('./welcome');
const ndaReminder = require('./ndaReminder');
const ndaStatusUpdate = require('./ndaStatusUpdate');
const escalation = require('./escalation');
const certificate = require('./certificate');
const referralReceived = require('./referralReceived');

module.exports = {
  welcome,
  ndaReminder,
  ndaStatusUpdate,
  escalation,
  certificate,
  referralReceived,
};
