// src/controllers/analysisController.js
'use strict';
const { validationResult } = require('express-validator');
const analysisService = require('../services/analysisService');
const { ValidationError } = require('../middleware/errorHandler');

const handleValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    throw new ValidationError('Validation failed', errors.array().map(e => ({ field: e.path, message: e.msg })));
};

const analyzeDocument = async (req, res, next) => {
  try {
    handleValidation(req);
    const analysis = await analysisService.analyze(req.params.id, req.user.userId, req.body.language);
    res.json({ message: 'Analysis completed', analysis });
  } catch (err) { next(err); }
};

const getAnalysis = async (req, res, next) => {
  try {
    const analysis = await analysisService.getAnalysis(req.params.id, req.user.userId);
    res.json({ analysis });
  } catch (err) { next(err); }
};

const askQuestion = async (req, res, next) => {
  try {
    handleValidation(req);
    const result = await analysisService.askQuestion(req.params.id, req.user.userId, req.body.question, req.body.language);
    res.json(result);
  } catch (err) { next(err); }
};

const getConversation = async (req, res, next) => {
  try {
    const conv = await analysisService.getConversation(req.params.id, req.user.userId);
    res.json({ conversation: conv });
  } catch (err) { next(err); }
};

module.exports = { analyzeDocument, getAnalysis, askQuestion, getConversation };
