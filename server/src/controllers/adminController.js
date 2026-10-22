// src/controllers/adminController.js
'use strict';
const adminService = require('../services/adminService');

const getDashboard = async (req, res, next) => {
  try { res.json(await adminService.getDashboard()); }
  catch (err) { next(err); }
};

const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    res.json(await adminService.getUsers(page, limit));
  } catch (err) { next(err); }
};

module.exports = { getDashboard, getUsers };
