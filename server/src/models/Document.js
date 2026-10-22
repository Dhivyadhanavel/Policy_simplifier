// server/src/models/Document.js
'use strict';

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    originalFilename: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
      maxlength: [255, 'Filename cannot exceed 255 characters'],
    },
    storedFilename: {
      type: String,
      required: [true, 'Stored filename is required'],
      trim: true,
      maxlength: [255, 'Stored filename cannot exceed 255 characters'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      enum: {
        values: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        message: 'Unsupported file type',
      },
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: [1, 'File size must be at least 1 byte'],
    },
    documentType: {
      type: String,
      enum: { values: ['contract', 'policy', 'agreement', 'other'], message: 'Invalid document type' },
      default: 'other',
    },
    extractedText: {
      type: String,
      default: null,
      // Large field â€” not indexed; access via Document.findById + .lean()
    },
    pageCount: {
      type: Number,
      min: [1, 'Page count must be at least 1'],
      default: null,
    },
    processingStatus: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'completed', 'failed'],
        message: 'Invalid processing status',
      },
      default: 'pending',
    },
    processingError: {
      type: String,
      default: null,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Indexes
documentSchema.index({ userId: 1, uploadDate: -1 });
documentSchema.index({ processingStatus: 1 });

// Exclude extractedText from default list queries for performance
documentSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.extractedText;
  return obj;
};

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;

