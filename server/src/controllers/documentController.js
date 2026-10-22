// src/controllers/documentController.js
'use strict';
const { validationResult } = require('express-validator');
const documentService = require('../services/documentService');
const { ValidationError, UnsupportedMediaTypeError } = require('../middleware/errorHandler');

const handleValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    throw new ValidationError('Validation failed', errors.array().map(e => ({ field: e.path, message: e.msg })));
};

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) throw new UnsupportedMediaTypeError('No file provided in the request');
    const doc = await documentService.upload(req.file, req.user.userId);

    // Run extraction synchronously so we can return rejection errors immediately
    try {
      await documentService.extract(doc._id);
      // Re-fetch to get updated status and documentType
      const updated = await documentService.getById(doc._id, req.user.userId, false);
      res.status(201).json({ message: 'Document uploaded and processed successfully', document: updated });
    } catch (extractErr) {
      // If it's a validation error (wrong doc type), pass to error handler
      // The document record is already deleted inside extract() for rejections
      return next(extractErr);
    }
  } catch (err) { next(err); }
};

const listDocuments = async (req, res, next) => {
  try {
    handleValidation(req);
    const { search, mimeType, startDate, endDate } = req.query;
    const docs = await documentService.list(req.user.userId, { search, mimeType, startDate, endDate });
    res.json({ documents: docs, count: docs.length });
  } catch (err) { next(err); }
};

const getDocument = async (req, res, next) => {
  try {
    const doc = await documentService.getById(req.params.id, req.user.userId, false);
    res.json({ document: doc });
  } catch (err) { next(err); }
};

const getDocumentText = async (req, res, next) => {
  try {
    const doc = await documentService.getById(req.params.id, req.user.userId, true);
    res.json({ extractedText: doc.extractedText, pageCount: doc.pageCount });
  } catch (err) { next(err); }
};

const deleteDocument = async (req, res, next) => {
  try {
    await documentService.deleteDocument(req.params.id, req.user.userId);
    res.json({ message: 'Document and all associated data deleted successfully' });
  } catch (err) { next(err); }
};

module.exports = { uploadDocument, listDocuments, getDocument, getDocumentText, deleteDocument };

