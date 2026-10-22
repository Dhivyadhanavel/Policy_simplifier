// src/routes/userRoutes.js
'use strict';
const express = require('express');
const { body } = require('express-validator');
const { authenticateJWT } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

const profileValidators = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 100 }),
  body('email').optional().trim().isEmail().withMessage('Invalid email').isLength({ max: 254 }).normalizeEmail(),
  body('preferredLanguage').optional().isIn(['en', 'ta']).withMessage('Language must be en or ta'),
  body('role').optional().custom(() => { throw new Error('Role cannot be changed via this endpoint'); }),
];

router.get('/profile', authenticateJWT, userController.getProfile);
router.patch('/profile', authenticateJWT, profileValidators, userController.updateProfile);

module.exports = router;
