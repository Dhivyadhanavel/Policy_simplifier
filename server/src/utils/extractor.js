// src/utils/extractor.js
'use strict';

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const MIN_SELECTABLE_TEXT_LENGTH = 10;

/**
 * Extract text from a PDF buffer using pdf-parse.
 * Never executes or evaluates document content.
 */
const extractPdf = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    const text = data.text || '';
    const pageCount = data.numpages || 1;

    if (text.replace(/\s/g, '').length < MIN_SELECTABLE_TEXT_LENGTH) {
      throw new Error('PDF contains no extractable text (possibly scanned or image-only)');
    }

    return { text: text.trim(), pageCount, extractedViaOcr: false };
  } catch (err) {
    throw new Error(`PDF extraction failed: ${err.message}`);
  }
};

/**
 * Extract text from a DOCX buffer using Mammoth.
 * Never executes or evaluates document content.
 */
const extractDocx = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('No text content found in DOCX file');
    }
    return { text: result.value.trim(), pageCount: null, extractedViaOcr: false };
  } catch (err) {
    throw new Error(`DOCX extraction failed: ${err.message}`);
  }
};

module.exports = { extractPdf, extractDocx };
