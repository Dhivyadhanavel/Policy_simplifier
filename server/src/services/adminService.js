// src/services/adminService.js
'use strict';

const User = require('../models/User');
const Document = require('../models/Document');
const Analysis = require('../models/Analysis');

const getDashboard = async () => {
  const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  const [totalUsers, totalDocuments, docTypeDistribution, analysisStats, monthlyUsage] = await Promise.all([
    User.countDocuments(),
    Document.countDocuments(),
    Document.aggregate([
      { $group: { _id: '$documentType', count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } },
    ]),
    Analysis.aggregate([
      { $group: { _id: '$processingStatus', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]),
    Document.aggregate([
      { $match: { uploadDate: { $gte: twelveMonthsAgo } } },
      { $group: { _id: { year: { $year: '$uploadDate' }, month: { $month: '$uploadDate' } }, documentCount: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $project: { year: '$_id.year', month: '$_id.month', documentCount: 1, _id: 0 } },
    ]),
  ]);

  return {
    totalUsers,
    totalDocuments,
    documentTypeDistribution: docTypeDistribution,
    completedAnalyses: analysisStats.find(s => s.status === 'completed')?.count || 0,
    failedAnalyses: analysisStats.find(s => s.status === 'failed')?.count || 0,
    monthlyUsage,
    recentErrors: [],
  };
};

const getUsers = async (page, limit) => {
  page = Math.max(1, page || 1);
  limit = Math.min(100, Math.max(1, limit || 20));
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find({}).select('name email role createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(),
  ]);
  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
};

module.exports = { getDashboard, getUsers };
