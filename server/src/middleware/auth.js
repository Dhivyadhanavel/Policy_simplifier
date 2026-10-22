// server/src/middleware/auth.js
'use strict';

const jwt = require('jsonwebtoken');
const { AuthenticationError, ForbiddenError } = require('./errorHandler');

/**
 * Extracts and verifies the JWT from the Authorization header.
 * On success, attaches req.user = { userId, role } and calls next().
 * On failure, passes an AuthenticationError (401) to next.
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Authentication required'));
  }

  const token = authHeader.slice(7); // Remove 'Bearer '
  if (!token) {
    return next(new AuthenticationError('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token expired'));
    }
    return next(new AuthenticationError('Invalid token'));
  }
};

/**
 * Middleware factory that checks req.user.role matches the required role.
 * Must be used after authenticateJWT.
 */
const requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }
  if (req.user.role !== role) {
    return next(new ForbiddenError('Insufficient privileges'));
  }
  next();
};

module.exports = { authenticateJWT, requireRole };
