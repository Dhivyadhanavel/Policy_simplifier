// server/src/server.js
'use strict';

// Fix OpenSSL 3.x TLS compatibility with MongoDB Atlas on Node 22
process.env.NODE_OPTIONS = (process.env.NODE_OPTIONS || '') + ' --tls-min-v1.2';

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });

// --- Environment validation ---
const REQUIRED_VARS = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY', 'GEMINI_MODEL', 'FRONTEND_URL'];

const missing = REQUIRED_VARS.filter(v => !process.env[v] || process.env[v].trim() === '');
if (missing.length > 0) {
  console.error(`[STARTUP] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const maxFileSize = parseInt(process.env.MAX_FILE_SIZE, 10);
if (!process.env.MAX_FILE_SIZE || isNaN(maxFileSize) || maxFileSize < 1 || maxFileSize > 104857600) {
  console.error('[STARTUP] MAX_FILE_SIZE must be an integer between 1 and 104857600. Got:', process.env.MAX_FILE_SIZE);
  process.exit(1);
}

const port = parseInt(process.env.PORT || '5000', 10);
if (isNaN(port) || port < 1 || port > 65535) {
  console.error('[STARTUP] PORT must be an integer between 1 and 65535. Got:', process.env.PORT);
  process.exit(1);
}

// --- App bootstrap ---
const connectDB = require('./config/database');
const app = require('./app');

const start = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`[SERVER] LexiClear server running on port ${port}`);
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

start().catch(err => {
  console.error('[SERVER] Failed to start:', err);
  process.exit(1);
});

module.exports = app;
