const formatMessage = (level, message) => `[${new Date().toISOString()}] [${level}] ${message}`;

module.exports = {
  info: (message) => console.log(formatMessage('INFO', message)),
  warn: (message) => console.warn(formatMessage('WARN', message)),
  error: (message) => console.error(formatMessage('ERROR', message)),
};
