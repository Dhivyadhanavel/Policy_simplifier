// src/routes/documentRoutes.js
'use strict';
const express = require('express');
const multer = require('multer');
const { query, param, body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { authenticateJWT } = require('../middleware/auth');
const documentController = require('../controllers/documentController');
const comparisonController = require('../controllers/comparisonController');
const reportController = require('../controllers/reportController');
const analysisController = require('../controllers/analysisController');

const router = express.Router();

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 26214400;
const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
    else cb(Object.assign(new Error('Only PDF and DOCX files are supported'), { code: 'INVALID_MIME' }), false);
  },
});

const handleMulterError = (err, req, res, next) => {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File exceeds maximum allowed size' });
  if (err.code === 'INVALID_MIME') return res.status(422).json({ error: err.message });
  return next(err);
};

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'AI request limit reached. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const idParam = param('id').isMongoId().withMessage('Invalid document ID');
const langBody = body('language').optional().isIn(['en', 'ta']).withMessage('Language must be en or ta');

// Upload
router.post('/upload', authenticateJWT,
  (req, res, next) => upload.single('file')(req, res, (err) => handleMulterError(err, req, res, next)),
  documentController.uploadDocument
);

// Compare (must be before /:id routes to avoid conflict)
router.post('/compare', authenticateJWT,
  body('documentIdA').isMongoId().withMessage('documentIdA must be a valid document ID'),
  body('documentIdB').isMongoId().withMessage('documentIdB must be a valid document ID'),
  langBody,
  comparisonController.compareDocuments
);

// List
router.get('/', authenticateJWT,
  query('search').optional().trim().isLength({ max: 255 }),
  query('mimeType').optional().isIn(ALLOWED_MIMES),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  documentController.listDocuments
);

// Single doc
router.get('/:id', authenticateJWT, idParam, documentController.getDocument);
router.get('/:id/text', authenticateJWT, idParam, documentController.getDocumentText);
router.delete('/:id', authenticateJWT, idParam, documentController.deleteDocument);

// Analysis
router.post('/:id/analyze', authenticateJWT, aiLimiter, idParam, langBody, analysisController.analyzeDocument);
router.get('/:id/analysis', authenticateJWT, idParam, analysisController.getAnalysis);
router.post('/:id/questions', authenticateJWT, aiLimiter, idParam,
  body('question').trim().notEmpty().withMessage('Question is required').isLength({ max: 2000 }),
  langBody,
  analysisController.askQuestion
);
router.get('/:id/conversation', authenticateJWT, idParam, analysisController.getConversation);

// Report
router.get('/:id/report', authenticateJWT, idParam, reportController.downloadReport);


// POST /api/documents/:id/reextract - re-trigger extraction for stuck docs
router.post('/:id/reextract', authenticateJWT, idParam, async (req, res, next) => {
  try {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid document ID' });
    
    await documentService.extract(req.params.id);
    const doc = await documentService.getById(req.params.id, req.user.userId, false);
    res.json({ message: 'Extraction completed', document: doc });
  } catch (err) { next(err); }
});

module.exports = router;


