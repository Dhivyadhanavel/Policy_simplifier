// src/routes/adminRoutes.js
'use strict';
const express = require('express');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(authenticateJWT, requireRole('admin'));
router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);

module.exports = router;
