const { validationResult } = require('express-validator');
const { apiError } = require('../utils/helpers');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));
    return apiError(res, 'Validation failed for the request payload', 'VALIDATION_ERROR', 422, errorDetails);
  }
  next();
};

module.exports = { validate };
