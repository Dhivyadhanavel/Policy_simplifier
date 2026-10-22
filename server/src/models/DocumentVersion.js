// server/src/models/DocumentVersion.js
'use strict';

const mongoose = require('mongoose');

const comparisonResultsSchema = new mongoose.Schema({
  addedClauses: { type: [String], default: [] },
  removedClauses: { type: [String], default: [] },
  modifiedClauses: {
    type: [{ before: String, after: String }],
    default: [],
  },
  changedDates: {
    type: [{ before: String, after: String }],
    default: [],
  },
  changedAmounts: {
    type: [{ before: String, after: String }],
    default: [],
  },
  changedObligations: {
    type: [{ before: String, after: String }],
    default: [],
  },
  changedTerminationConditions: {
    type: [{ before: String, after: String }],
    default: [],
  },
  aiExplanation: { type: String, default: '' },
  disclaimer: {
    type: String,
    default: 'Textual changes do not necessarily carry a legal consequence. This comparison is AI-generated and informational only.',
  },
}, { _id: false });

const documentVersionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    originalDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Original document ID is required'],
    },
    comparedDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Compared document ID is required'],
    },
    comparisonResults: {
      type: comparisonResultsSchema,
      required: [true, 'Comparison results are required'],
    },
    analysisLanguage: {
      type: String,
      enum: ['en', 'ta'],
      default: 'en',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

documentVersionSchema.index({ userId: 1 });
documentVersionSchema.index({ originalDocumentId: 1, comparedDocumentId: 1 });

const DocumentVersion = mongoose.model('DocumentVersion', documentVersionSchema);
module.exports = DocumentVersion;
