// server/src/controllers/authController.js
'use strict';

const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const { ValidationError } = require('../middleware/errorHandler');

const handleValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array().map(e => ({
      field: e.path,
      message: e.msg,
    })));
  }
};

const register = async (req, res, next) => {
  try {
    handleValidationErrors(req);
    const { name, email, password } = req.body;
    const result = await authService.register(name, email, password);
    res.status(201).json({ message: 'Account created successfully', ...result });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    handleValidationErrors(req);
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);
    if (!user) return next(new (require('../middleware/errorHandler').NotFoundError)('User not found'));
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
