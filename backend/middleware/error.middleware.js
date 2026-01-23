/**
 * middleware/error.middleware.js
 *
 * Responsibility:
 * - Catch ALL errors from controllers, routes, async flows
 * - Send clean, predictable error responses
 * - Prevent server crashes
 *
 * This must be the LAST middleware in server.js
 */

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  /**
   * Handle common Mongoose errors
   */

  // Invalid MongoDB ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  }

  // Duplicate key error (e.g. unique phone, email)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  /**
   * Log error (important for production debugging)
   * Later this can be sent to Winston / Sentry
   */
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
