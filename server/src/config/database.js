// server/src/config/database.js
'use strict';

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const isAtlas = uri && uri.includes('mongodb.net');

  const options = {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  };

  // Only add TLS options for Atlas connections
  if (isAtlas) {
    options.tls = true;
    options.ssl = true;
  }

  try {
    await mongoose.connect(uri, options);
    console.log(`[DB] MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('[DB] MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
