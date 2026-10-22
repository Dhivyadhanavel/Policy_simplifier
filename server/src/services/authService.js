// server/src/services/authService.js
'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthenticationError, ConflictError, ValidationError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '24h';

const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET;
  return jwt.sign({ userId: userId.toString(), role }, secret, { expiresIn: TOKEN_EXPIRY });
};

const register = async (name, email, password) => {
  // Check for duplicate email
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new ConflictError('An account with this email address is already registered');
  }

  // Hash password — never store plaintext
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user with default role 'user'
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role: 'user',
    preferredLanguage: 'en',
  });

  // Generate JWT (do NOT include passwordHash in token payload)
  const token = generateToken(user._id, user.role);

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      createdAt: user.createdAt,
    },
  };
};

const login = async (email, password) => {
  // Use generic error message — never disclose which field is wrong
  const GENERIC_ERROR = 'Invalid email or password';

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  if (!user) {
    throw new AuthenticationError(GENERIC_ERROR);
  }

  // We need passwordHash to compare — User.toJSON() strips it, so access via schema directly
  const rawUser = await User.findOne({ email: email.toLowerCase().trim() }).lean();
  if (!rawUser) throw new AuthenticationError(GENERIC_ERROR);

  const isMatch = await bcrypt.compare(password, rawUser.passwordHash);
  if (!isMatch) {
    throw new AuthenticationError(GENERIC_ERROR);
  }

  const token = generateToken(rawUser._id, rawUser.role);

  return {
    token,
    user: {
      _id: rawUser._id,
      name: rawUser.name,
      email: rawUser.email,
      role: rawUser.role,
      preferredLanguage: rawUser.preferredLanguage,
      createdAt: rawUser.createdAt,
    },
  };
};

module.exports = { register, login, generateToken };
