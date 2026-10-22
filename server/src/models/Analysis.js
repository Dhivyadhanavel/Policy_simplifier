// server/src/models/Analysis.js
'use strict';

const mongoose = require('mongoose');

const DISCLAIMER = 'Risk levels are AI-generated informational indicators and do not constitute legal advice or a determination of legal validity. A flagged clause is not necessarily illegal or unenforceable.';

const riskFindingSchema = new mongoose.Schema({
  clauseTitle: { type: String, maxlength: 200, default: '' },
  sourceExcerpt: { type: String, maxlength: 1000, default: '' },
  plainExplanation: { type: String, maxlength: 500, default: '' },
  potentialConcern: { type: String, maxlength: 500, default: '' },
  flagReason: { type: String, maxlength: 500, default: '' },
  suggestedQuestion: { type: String, maxlength: 300, default: '' },
  riskCategory: {
    type: String,
    enum: {
      values: ['Financial', 'Legal Obligation', 'Termination', 'Liability', 'Privacy', 'Other'],
      message: 'Invalid risk category',
    },
    default: 'Other',
  },
  riskLevel: {
    type: String,
    enum: { values: ['Low', 'Medium', 'High'], message: 'Invalid risk level' },
    default: 'Low',
  },
  sectionReference: { type: String, maxlength: 100, default: '' },
}, { _id: false });

const analysisSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Document ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    overview: { type: String, maxlength: 10000, default: 'Not specified in the document.' },
    detailedSummary: { type: String, maxlength: 50000, default: 'Not specified in the document.' },
    sectionSummaries: {
      type: [{
        section: { type: String, default: '' },
        summary: { type: String, default: '' },
      }],
      default: [],
    },
    importantClauses: {
      type: [{
        title: { type: String, default: '' },
        excerpt: { type: String, default: '' },
        explanation: { type: String, default: '' },
      }],
      default: [],
    },
    obligations: {
      type: [{
        obligation: { type: String, default: '' },
        party: { type: String, default: '' },
      }],
      default: [],
    },
    deadlines: {
      type: [{
        description: { type: String, default: '' },
        date: { type: String, default: 'Not specified in the document.' },
      }],
      default: [],
    },
    glossary: {
      type: [{
        term: { type: String, default: '' },
        definition: { type: String, default: '' },
      }],
      default: [],
    },
    riskFindings: {
      type: [riskFindingSchema],
      default: [],
    },
    analysisLanguage: {
      type: String,
      enum: { values: ['en', 'ta'], message: 'Language must be en or ta' },
      default: 'en',
    },
    modelUsed: { type: String, maxlength: 255, default: '' },
    processingStatus: {
      type: String,
      enum: { values: ['pending', 'completed', 'failed'], message: 'Invalid processing status' },
      default: 'pending',
    },
    processingError: { type: String, default: null },
    disclaimer: { type: String, default: DISCLAIMER },
  },
  { timestamps: true }
);

analysisSchema.index({ documentId: 1 });
analysisSchema.index({ userId: 1 });

const Analysis = mongoose.model('Analysis', analysisSchema);
module.exports = Analysis;
