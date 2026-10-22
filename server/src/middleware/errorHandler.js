// server/src/middleware/errorHandler.js
'use strict';

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}
class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') { super(message, 401); }
}
class ForbiddenError extends AppError {
  constructor(message = 'Access denied') { super(message, 403); }
}
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') { super(message, 404); }
}
class ConflictError extends AppError {
  constructor(message = 'Resource already exists') { super(message, 409); }
}
class FileTooLargeError extends AppError {
  constructor(message = 'File exceeds maximum allowed size') { super(message, 413); }
}
class UnsupportedMediaTypeError extends AppError {
  constructor(message = 'File type not supported') { super(message, 422); }
}
class AIServiceError extends AppError {
  constructor(message = 'AI service returned an invalid response') { super(message, 502); }
}
class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable, please retry') { super(message, 503); }
}

// Global Express error handler
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} ${req.method} ${req.path}:`, err);

  if (err.isOperational) {
    const body = { error: err.message };
    if (err.errors && err.errors.length) body.errors = err.errors;
    return res.status(err.statusCode).json(body);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
    return res.status(400).json({ error: 'Validation failed', errors });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ error: `${field} already exists` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File exceeds maximum allowed size' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(422).json({ error: 'Unexpected file field' });
  }

  // Unknown — log full error, return generic message
  console.error('[UNHANDLED ERROR]', err.stack);
  return res.status(500).json({ error: 'An unexpected error occurred. Please try again or contact support.' });
};

module.exports = {
  AppError, ValidationError, AuthenticationError, ForbiddenError,
  NotFoundError, ConflictError, FileTooLargeError, UnsupportedMediaTypeError,
  AIServiceError, ServiceUnavailableError, errorHandler,
};
