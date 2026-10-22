// server/src/models/Conversation.js
'use strict';

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: { values: ['user', 'assistant'], message: 'Role must be user or assistant' },
    required: [true, 'Message role is required'],
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [10000, 'Message content cannot exceed 10000 characters'],
  },
  sourceReferences: {
    type: [{
      section: { type: String, default: '' },
      page: { type: Number, default: null },
      excerpt: { type: String, default: '' },
    }],
    default: [],
  },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Document ID is required'],
    },
    messages: {
      type: [messageSchema],
      default: [],
      validate: {
        validator: (v) => v.length <= 1000,
        message: 'Conversation cannot exceed 1000 messages',
      },
    },
  },
  { timestamps: true }
);

// One conversation per user per document
conversationSchema.index({ userId: 1, documentId: 1 }, { unique: true });
conversationSchema.index({ userId: 1 });
conversationSchema.index({ documentId: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;
