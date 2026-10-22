// src/services/comparisonService.js
'use strict';

const diffLib = require('diff');
const Document = require('../models/Document');
const DocumentVersion = require('../models/DocumentVersion');
const aiService = require('./aiService');
const { ForbiddenError, NotFoundError } = require('../middleware/errorHandler');

const compare = async (docIdA, docIdB, userId, language) => {
  if (!language || !['en','ta'].includes(language)) language = 'en';
  const [docA, docB] = await Promise.all([
    Document.findById(docIdA).lean(),
    Document.findById(docIdB).lean(),
  ]);
  if (!docA) throw new NotFoundError('Document A not found');
  if (!docB) throw new NotFoundError('Document B not found');
  if (docA.userId.toString() !== userId.toString()) throw new ForbiddenError('Access denied to document A');
  if (docB.userId.toString() !== userId.toString()) throw new ForbiddenError('Access denied to document B');

  const textA = docA.extractedText || '';
  const textB = docB.extractedText || '';
  const diffResult = diffLib.diffLines(textA, textB);

  const addedClauses = [];
  const removedClauses = [];
  const modifiedClauses = [];

  let i = 0;
  while (i < diffResult.length) {
    const chunk = diffResult[i];
    if (chunk.removed && i + 1 < diffResult.length && diffResult[i + 1].added) {
      modifiedClauses.push({ before: chunk.value.trim(), after: diffResult[i + 1].value.trim() });
      i += 2;
    } else if (chunk.added) {
      addedClauses.push(chunk.value.trim());
      i++;
    } else if (chunk.removed) {
      removedClauses.push(chunk.value.trim());
      i++;
    } else {
      i++;
    }
  }

  const diffSummary = {
    addedClauses, removedClauses, modifiedClauses,
    changedDates: [], changedAmounts: [], changedObligations: [], changedTerminationConditions: [],
  };

  let aiExplanation = '';
  try {
    const exp = await aiService.explainComparison(diffSummary, language);
    aiExplanation = exp.explanation || '';
  } catch (err) {
    console.error('[ComparisonService] AI explanation failed:', err.message);
    aiExplanation = 'AI explanation could not be generated at this time.';
  }

  const record = await DocumentVersion.create({
    userId,
    originalDocumentId: docIdA,
    comparedDocumentId: docIdB,
    comparisonResults: { ...diffSummary, aiExplanation },
    analysisLanguage: language,
  });

  return record;
};

module.exports = { compare };
