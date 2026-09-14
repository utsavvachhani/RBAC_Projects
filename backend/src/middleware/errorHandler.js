const { apiError } = require('../utils/helpers');

// Centralized error handler
const errorHandler = (err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return apiError(
      res,
      `A record with this ${field} already exists.`,
      'DUPLICATE_KEY_ERROR',
      409
    );
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return apiError(res, messages.join(', '), 'VALIDATION_ERROR', 422);
  }

  // CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return apiError(res, `Resource not found with id: ${err.value}`, 'NOT_FOUND', 404);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return apiError(
    res,
    message,
    err.code || 'INTERNAL_SERVER_ERROR',
    statusCode,
    process.env.NODE_ENV === 'development' ? err.stack : undefined
  );
};

module.exports = errorHandler;
