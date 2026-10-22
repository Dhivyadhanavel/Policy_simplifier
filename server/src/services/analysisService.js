// src/services/analysisService.js
'use strict';

const Document = require('../models/Document');
const Analysis = require('../models/Analysis');
const Conversation = require('../models/Conversation');
const aiService = require('./aiService');
const { chunkText, selectRelevantChunks } = require('../utils/chunker');
const { ForbiddenError, NotFoundError, ConflictError } = require('../middleware/errorHandler');

const MAX_CHUNK_CHARS = 50000;
const NOT_SPECIFIED = 'Not specified in the document.';

const mergeAnalyses = (parts) => {
  if (!parts.length) return null;
  if (parts.length === 1) return parts[0];
  return {
    overview: parts.map(p => p.overview || '').filter(Boolean).join('\n\n') || NOT_SPECIFIED,
    detailedSummary: parts.map(p => p.detailedSummary || '').filter(Boolean).join('\n\n') || NOT_SPECIFIED,
    sectionSummaries: parts.flatMap(p => p.sectionSummaries || []),
    importantClauses: parts.flatMap(p => p.importantClauses || []),
    obligations: parts.flatMap(p => p.obligations || []),
    deadlines: parts.flatMap(p => p.deadlines || []),
    glossary: parts.flatMap(p => p.glossary || []),
    riskFindings: parts.flatMap(p => p.riskFindings || []),
  };
};

const resolveLanguage = async (userId, requested) => {
  if (requested && ['en', 'ta'].includes(requested)) return requested;
  const User = require('../models/User');
  const user = await User.findById(userId).lean();
  return user?.preferredLanguage || 'en';
};

const analyze = async (documentId, userId, language) => {
  const doc = await Document.findById(documentId).lean();
  if (!doc) throw new NotFoundError('Document not found');
  if (doc.userId.toString() !== userId.toString()) throw new ForbiddenError('Access denied');
  if (doc.processingStatus !== 'completed')
    throw new ConflictError('Document extraction is not complete. Wait for extraction to finish before analysing.');
  if (!doc.extractedText)
    throw new ConflictError('Document has no extracted text available for analysis');

  const lang = await resolveLanguage(userId, language);
  const modelUsed = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  let analysisRecord = await Analysis.findOne({ documentId });
  if (analysisRecord) {
    await Analysis.findByIdAndUpdate(analysisRecord._id, { processingStatus: 'pending', processingError: null });
  } else {
    analysisRecord = await Analysis.create({ documentId, userId, processingStatus: 'pending', analysisLanguage: lang, modelUsed });
  }

  try {
    const chunks = chunkText(doc.extractedText, MAX_CHUNK_CHARS);
    const partials = [];
    for (const chunk of chunks) {
      partials.push(await aiService.analyzeDocument(chunk.text, lang));
    }
    const merged = mergeAnalyses(partials);

    const updated = await Analysis.findByIdAndUpdate(
      analysisRecord._id,
      {
        overview: merged.overview || NOT_SPECIFIED,
        detailedSummary: merged.detailedSummary || NOT_SPECIFIED,
        sectionSummaries: merged.sectionSummaries,
        importantClauses: merged.importantClauses,
        obligations: merged.obligations,
        deadlines: merged.deadlines,
        glossary: merged.glossary,
        riskFindings: merged.riskFindings,
        analysisLanguage: lang,
        modelUsed,
        processingStatus: 'completed',
        processingError: null,
      },
      { new: true }
    );
    return updated;
  } catch (err) {
    await Analysis.findByIdAndUpdate(analysisRecord._id, { processingStatus: 'failed', processingError: err.message });
    throw err;
  }
};

const getAnalysis = async (documentId, userId) => {
  const doc = await Document.findById(documentId).lean();
  if (!doc) throw new NotFoundError('Document not found');
  if (doc.userId.toString() !== userId.toString()) throw new ForbiddenError('Access denied');
  const analysis = await Analysis.findOne({ documentId, processingStatus: 'completed' }).lean();
  if (!analysis) throw new NotFoundError('No completed analysis found. Please run analysis first.');
  return analysis;
};

const askQuestion = async (documentId, userId, question, language) => {
  const doc = await Document.findById(documentId).lean();
  if (!doc) throw new NotFoundError('Document not found');
  if (doc.userId.toString() !== userId.toString()) throw new ForbiddenError('Access denied');
  if (!doc.extractedText) throw new ConflictError('Document has no extracted text for Q&A');

  const lang = await resolveLanguage(userId, language);
  const contextText = selectRelevantChunks(doc.extractedText, question, MAX_CHUNK_CHARS);
  const result = await aiService.answerQuestion(contextText, question, lang);

  await Conversation.findOneAndUpdate(
    { userId, documentId },
    {
      $push: {
        messages: {
          $each: [
            { role: 'user', content: question, sourceReferences: [], timestamp: new Date() },
            { role: 'assistant', content: result.answer, sourceReferences: result.sourceReferences || [], timestamp: new Date() },
          ],
        },
      },
      $setOnInsert: { userId, documentId },
    },
    { upsert: true, new: true }
  );

  return { answer: result.answer, sourceReferences: result.sourceReferences || [] };
};

const getConversation = async (documentId, userId) => {
  const doc = await Document.findById(documentId).lean();
  if (!doc) throw new NotFoundError('Document not found');
  if (doc.userId.toString() !== userId.toString()) throw new ForbiddenError('Access denied');
  const conv = await Conversation.findOne({ userId, documentId }).lean();
  return conv || { userId, documentId, messages: [] };
};

module.exports = { analyze, getAnalysis, askQuestion, getConversation };
