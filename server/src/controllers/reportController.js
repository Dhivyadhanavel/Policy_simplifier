// src/controllers/reportController.js
'use strict';
const reportService = require('../services/reportService');

const downloadReport = async (req, res, next) => {
  try {
    await reportService.generateReport(req.params.id, req.user.userId, res);
  } catch (err) { next(err); }
};

module.exports = { downloadReport };
