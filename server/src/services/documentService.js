// server/src/services/documentService.js
'use strict';
console.log('[DocumentService] v2.0 loaded - classification active');

const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const Document = require('../models/Document');
const { extractPdf, extractDocx } = require('../utils/extractor');
const { classifyDocument } = require('./aiService');
const { ForbiddenError, NotFoundError, UnsupportedMediaTypeError, FileTooLargeError, ValidationError } = require('../middleware/errorHandler');

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', '..', 'uploads');
const ALLOWED_MIMES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

/**
 * Upload a file: validate MIME + size, store with safe filename, create Document record.
 */
const upload = async (file, userId) => {
  ensureUploadDir();
  const maxSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 26214400;

  if (!file) throw new UnsupportedMediaTypeError('No file provided');
  if (!ALLOWED_MIMES[file.mimetype]) throw new UnsupportedMediaTypeError('Only PDF and DOCX files are supported');
  if (file.size > maxSize) throw new FileTooLargeError(`File size exceeds the ${maxSize} byte limit`);

  const ext = ALLOWED_MIMES[file.mimetype];
  const safeFilename = `${randomUUID()}${ext}`;

  const destPath = path.join(UPLOAD_DIR, safeFilename);
  const resolvedDest = path.resolve(destPath);
  if (!resolvedDest.startsWith(path.resolve(UPLOAD_DIR))) {
    throw new Error('Path traversal detected - rejecting upload');
  }

  fs.writeFileSync(resolvedDest, file.buffer);

  const doc = await Document.create({
    userId,
    originalFilename: file.originalname,
    storedFilename: safeFilename,
    mimeType: file.mimetype,
    fileSize: file.size,
    documentType: 'other',
    processingStatus: 'pending',
    uploadDate: new Date(),
  });

  return {
    _id: doc._id,
    originalFilename: doc.originalFilename,
    mimeType: doc.mimeType,
    fileSize: doc.fileSize,
    uploadDate: doc.uploadDate,
    processingStatus: doc.processingStatus,
    documentType: doc.documentType,
  };
};

/**
 * Extract text from a stored document, then classify it.
 * Rejects and deletes the document if it is not a policy/legal document.
 */
const extract = async (documentId) => {
  const doc = await Document.findById(documentId);
  if (!doc) throw new NotFoundError('Document not found');

  await Document.findByIdAndUpdate(documentId, { processingStatus: 'processing' });

  try {
    const filePath = path.join(UPLOAD_DIR, doc.storedFilename);
    if (!fs.existsSync(filePath)) {
      throw new Error('Stored file not found on disk');
    }
    const buffer = fs.readFileSync(filePath);

    // Step 1: Extract text
    let result;
    if (doc.mimeType === 'application/pdf') {
      result = await extractPdf(buffer);
    } else {
      result = await extractDocx(buffer);
    }

    if (!result.text || result.text.trim().length === 0) {
      throw new Error('No text content found in document');
    }

    // Step 2: Classify document type — reject if not a policy/legal document
    console.log(`[DocumentService] Classifying document: ${doc.originalFilename}`);
    const classification = await classifyDocument(result.text);
    console.log(`[DocumentService] Classification result:`, classification);

    if (!classification.accepted) {
      // Delete file from disk — don't keep rejected documents
      try { fs.unlinkSync(filePath); } catch {}

      // Delete the Document record from DB
      await Document.findByIdAndDelete(documentId);

      // Throw error with the user-friendly rejection reason
      throw new ValidationError(classification.reason || 'This document type is not accepted. Please upload a government scheme, policy, legal contract, or insurance document.');
    }

    // Step 3: Save extracted text and mark completed
    await Document.findByIdAndUpdate(documentId, {
      extractedText: result.text,
      pageCount: result.pageCount || null,
      documentType: classification.documentType || 'policy_document',
      processingStatus: 'completed',
      processingError: null,
    });

    return {
      success: true,
      textLength: result.text.length,
      pageCount: result.pageCount,
      documentType: classification.documentType,
    };
  } catch (err) {
    // Only update to failed if the doc record still exists (not deleted by rejection)
    const stillExists = await Document.findById(documentId);
    if (stillExists) {
      await Document.findByIdAndUpdate(documentId, {
        processingStatus: 'failed',
        processingError: err.message,
      });
    }
    throw err;
  }
};

/**
 * List documents for a user with optional search/type/date filters.
 */
const list = async (userId, filters = {}) => {
  const query = { userId };

  if (filters.search) {
    query.originalFilename = { $regex: filters.search, $options: 'i' };
  }
  if (filters.mimeType) {
    query.mimeType = filters.mimeType;
  }
  if (filters.startDate || filters.endDate) {
    query.uploadDate = {};
    if (filters.startDate) query.uploadDate.$gte = new Date(filters.startDate);
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      query.uploadDate.$lte = end;
    }
  }

  const docs = await Document.find(query)
    .select('-extractedText')
    .sort({ uploadDate: -1 })
    .lean();

  return docs;
};

/**
 * Get a single document owned by the user.
 */
const getById = async (documentId, userId, includeText = false) => {
  const query = Document.findById(documentId);
  if (!includeText) query.select('-extractedText');
  const doc = await query.lean();
  if (!doc) throw new NotFoundError('Document not found');
  if (doc.userId.toString() !== userId.toString()) throw new ForbiddenError('Access denied');
  return doc;
};

/**
 * Delete a document and cascade-delete all associated data.
 */
const deleteDocument = async (documentId, userId) => {
  const doc = await Document.findById(documentId);
  if (!doc) throw new NotFoundError('Document not found');
  if (doc.userId.toString() !== userId.toString()) throw new ForbiddenError('Access denied');

  const Analysis = require('../models/Analysis');
  const Conversation = require('../models/Conversation');
  await Analysis.deleteMany({ documentId });
  await Conversation.deleteMany({ documentId });
  await Document.findByIdAndDelete(documentId);

  const filePath = path.join(UPLOAD_DIR, doc.storedFilename);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error(`[DocumentService] Failed to delete file ${filePath}:`, err.message);
  }

  return { deleted: true };
};

module.exports = { upload, extract, list, getById, deleteDocument, UPLOAD_DIR };
