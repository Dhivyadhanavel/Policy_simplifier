// src/controllers/userController.js
'use strict';
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { ValidationError, ConflictError, NotFoundError } = require('../middleware/errorHandler');

const handleValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    throw new ValidationError('Validation failed', errors.array().map(e => ({ field: e.path, message: e.msg })));
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).lean();
    if (!user) throw new NotFoundError('User not found');
    const { _id, name, email, role, preferredLanguage, createdAt } = user;
    res.json({ user: { _id, name, email, role, preferredLanguage, createdAt } });
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    handleValidation(req);
    const { name, email, preferredLanguage } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (preferredLanguage !== undefined) updates.preferredLanguage = preferredLanguage;
    if (email !== undefined) {
      const normalised = email.toLowerCase().trim();
      const conflict = await User.findOne({ email: normalised, _id: { $ne: req.user.userId } }).lean();
      if (conflict) throw new ConflictError('Email address is already in use');
      updates.email = normalised;
    }
    const updated = await User.findByIdAndUpdate(req.user.userId, updates, { new: true, runValidators: true }).lean();
    if (!updated) throw new NotFoundError('User not found');
    const { _id, name: n, email: e, role, preferredLanguage: pl, createdAt } = updated;
    res.json({ user: { _id, name: n, email: e, role, preferredLanguage: pl, createdAt } });
  } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile };
