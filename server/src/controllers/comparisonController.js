// src/controllers/comparisonController.js
'use strict';
const { validationResult } = require('express-validator');
const comparisonService = require('../services/comparisonService');
const { ValidationError } = require('../middleware/errorHandler');

const compareDocuments = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      throw new ValidationError('Validation failed', errors.array().map(e => ({ field: e.path, message: e.msg })));
    const { documentIdA, documentIdB, language } = req.body;
    const result = await comparisonService.compare(documentIdA, documentIdB, req.user.userId, language || 'en');
    res.json({ comparison: result });
  } catch (err) { next(err); }
};

module.exports = { compareDocuments };
