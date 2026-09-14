const crypto = require('crypto');
const UAParser = require('ua-parser-js');

/**
 * Standard API success response envelope
 */
const apiSuccess = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Standard API error response envelope
 */
const apiError = (res, message, code = 'ERROR', statusCode = 400, details = null) => {
  const payload = {
    success: false,
    message,
    code
  };
  if (details) {
    payload.details = details;
  }
  return res.status(statusCode).json(payload);
};

/**
 * Generate secure random token
 */
const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Extract client IP and device/browser info
 */
const parseClientInfo = (req) => {
  const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
  const userAgentString = req.headers['user-agent'] || '';
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  return {
    ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : '127.0.0.1',
    userAgent: userAgentString,
    device: result.device.type || (result.device.model ? result.device.model : 'Desktop'),
    browser: result.browser.name ? `${result.browser.name} ${result.browser.version || ''}`.trim() : 'Unknown Browser',
    operatingSystem: result.os.name ? `${result.os.name} ${result.os.version || ''}`.trim() : 'Unknown OS'
  };
};

module.exports = {
  apiSuccess,
  apiError,
  generateRandomToken,
  parseClientInfo
};
