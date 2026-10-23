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
  console.log('[Upload] Starting upload for file:', req.file ? req.file.originalname : 'NO FILE');
  try {
    if (!req.file) throw new UnsupportedMediaTypeError('No file provided in the request');

    // Step 1: Save file to disk + create DB record
    const doc = await documentService.upload(req.file, req.user.userId);
    console.log('[Upload] File saved, doc ID:', doc._id);

    // Step 2: Extract text + classify — runs synchronously so rejection returns error
    try {
      console.log('[Upload] Starting extraction + classification...');
      await documentService.extract(doc._id);
      console.log('[Upload] Extraction + classification PASSED');

      const updated = await documentService.getById(doc._id, req.user.userId, false);
      return res.status(201).json({ message: 'Document uploaded and processed successfully', document: updated });

    } catch (extractErr) {
      console.log('[Upload] Extraction/classification FAILED:', extractErr.message);
      console.log('[Upload] Error statusCode:', extractErr.statusCode);
      console.log('[Upload] Error isOperational:', extractErr.isOperational);
      return next(extractErr);
    }

  } catch (err) {
    console.log('[Upload] Outer catch error:', err.message);
    next(err);
  }
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