// server/src/utils/chunker.js
'use strict';

const DEFAULT_MAX_CHUNK_CHARS = 50000;
const DEFAULT_OVERLAP_CHARS = 2000;

/**
 * Split text into overlapping chunks on paragraph boundaries.
 * Never cuts mid-sentence. Returns [{ index, text }].
 *
 * @param {string} text - Input text to chunk
 * @param {number} maxChunkChars - Max characters per chunk (default 50,000)
 * @param {number} overlapChars - Character overlap between chunks (default 2,000)
 * @returns {{ index: number, text: string }[]}
 */
const chunkText = (text, maxChunkChars = DEFAULT_MAX_CHUNK_CHARS, overlapChars = DEFAULT_OVERLAP_CHARS) => {
  if (!text || text.trim().length === 0) return [];

  // If text fits in one chunk, return as-is
  if (text.length <= maxChunkChars) {
    return [{ index: 0, text: text.trim() }];
  }

  // Split on double-newlines (paragraph boundaries)
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let currentChunk = '';
  let chunkIndex = 0;
  let overlapBuffer = '';

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();
    if (!para) continue;

    const candidate = currentChunk ? currentChunk + '\n\n' + para : para;

    if (candidate.length > maxChunkChars && currentChunk) {
      // Save current chunk
      chunks.push({ index: chunkIndex++, text: currentChunk.trim() });

      // Start new chunk with overlap: take the last `overlapChars` of the previous chunk
      overlapBuffer = currentChunk.length > overlapChars
        ? currentChunk.slice(-overlapChars)
        : currentChunk;

      // Find a clean paragraph start in the overlap buffer
      const overlapParaBreak = overlapBuffer.indexOf('\n\n');
      const cleanOverlap = overlapParaBreak !== -1
        ? overlapBuffer.slice(overlapParaBreak + 2)
        : overlapBuffer;

      currentChunk = cleanOverlap ? cleanOverlap + '\n\n' + para : para;
    } else {
      currentChunk = candidate;
    }
  }

  // Push the last chunk
  if (currentChunk.trim()) {
    chunks.push({ index: chunkIndex, text: currentChunk.trim() });
  }

  return chunks;
};

/**
 * Score a chunk by keyword overlap with a question.
 * Used to select the most relevant chunks for Q&A.
 *
 * @param {string} chunk - Text chunk
 * @param {string} question - User question
 * @returns {number} relevance score (higher = more relevant)
 */
const scoreChunkRelevance = (chunk, question) => {
  if (!chunk || !question) return 0;
  const questionWords = new Set(
    question.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3) // ignore short stop words
  );
  const chunkLower = chunk.toLowerCase();
  let score = 0;
  questionWords.forEach(word => {
    if (chunkLower.includes(word)) score++;
  });
  return score;
};

/**
 * Select the most relevant chunks for a Q&A question up to a combined char limit.
 *
 * @param {string} text - Full extracted document text
 * @param {string} question - User question
 * @param {number} maxTotalChars - Max combined characters to return
 * @returns {string} - Combined relevant text
 */
const selectRelevantChunks = (text, question, maxTotalChars = DEFAULT_MAX_CHUNK_CHARS) => {
  if (!text || text.length <= maxTotalChars) return text || '';

  const chunks = chunkText(text, maxTotalChars / 2, 1000);
  if (chunks.length === 0) return '';

  // Score each chunk
  const scored = chunks.map(c => ({ ...c, score: scoreChunkRelevance(c.text, question) }));
  scored.sort((a, b) => b.score - a.score || a.index - b.index);

  // Build result up to maxTotalChars
  let result = '';
  for (const chunk of scored) {
    if (result.length + chunk.text.length + 4 > maxTotalChars) break;
    result += (result ? '\n\n---\n\n' : '') + chunk.text;
  }
  return result || chunks[0].text;
};

module.exports = { chunkText, scoreChunkRelevance, selectRelevantChunks };
