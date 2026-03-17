const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');
const { auth, authorize, checkTokenReuse, markTokenAsUsed } = require('../middleware/auth');
const { registerLimiter, authLimiter } = require('../middleware/rateLimiter');
const { body, validationResult } = require('express-validator');
const { validationRules } = require('../middleware/validateInput');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

// Password validation middleware
const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < minLength) {
        return 'Password must be at least 8 characters long';
    }
    if (!hasUpperCase || !hasLowerCase) {
        return 'Password must contain both uppercase and lowercase letters';
    }
    if (!hasNumber) {
        return 'Password must contain at least one number';
    }
    if (!hasSpecialChar) {
        return 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)';
    }
    return null;
};

// Generate JWT tokens - secrets MUST be present (validated at auth.js module load)
const generateTokens = (userId, role) => {
  // Secrets are validated at startup in auth.js - no fallbacks here
  const accessToken = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });
  const refreshToken = jwt.sign({ userId, role }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d'
  });
  return { accessToken, refreshToken };
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [chw, supervisor, district_officer, admin]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 */
router.post('/register', registerLimiter, validationRules.register, async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, phone, role, device_id } = req.body;

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12); // Increased from 10 to 12

    // Hierarchy Logic:
    let isApproved = false;
    let managedBy = null;

    // Check if requester is an authenticated Admin or Supervisor
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const requester = await User.findByPk(decoded.userId);

        if (requester) {
          if (requester.role === 'admin' || requester.role === 'district_officer') {
            isApproved = true; // Admin creates are auto-approved
          } else if (requester.role === 'supervisor' && role === 'chw') {
            isApproved = true; // Staff registered by their Director are auto-approved
            managedBy = requester.id;
          }
        }
      } catch (err) {
        // Token invalid, treat as public registration
      }
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      first_name,
      last_name,
      phone,
      role: role || 'chw',
      device_id,
      is_approved: isApproved,
      managed_by: managedBy
    });

    res.status(201).json({
      success: true,
      message: isApproved ? 'User registered successfully' : 'Registration pending approval',
      data: {
        id: user.id,
        is_approved: user.is_approved
      }
    });
  } catch (error) {
    logger.error({ err: error, username: req.body.username }, 'Registration error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               device_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, validationRules.login, async (req, res) => {
  try {
    const { username, password, device_id } = req.body;

    // Find user
    const user = await User.findOne({ where: { username } });

    if (!user) {
      logger.warn({ username, ip: req.ip }, 'FAILED_LOGIN: User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    if (!user.is_approved && user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Your account is pending approval by an administrator.'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      logger.warn({ username, userId: user.id, ip: req.ip }, 'FAILED_LOGIN: Password mismatch');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);

    // Update last login, device, and refresh token
    await user.update({
      last_login: new Date(),
      device_id: device_id || user.device_id,
      refresh_token: hashedRefresh
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          phone: user.phone
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    logger.error({ err: error, username: req.body.username }, 'Login error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/refresh - Refresh Access Token
router.post('/refresh', [
  body('refreshToken').notEmpty()
], async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    // CRITICAL: No fallback - throw if secret missing
    if (!process.env.REFRESH_TOKEN_SECRET) {
      throw new Error('REFRESH_TOKEN_SECRET is not configured');
    }
    
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findByPk(decoded.userId);
    if (!user || !user.refresh_token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refresh_token);
    if (!isMatch) {
      // Check for token reuse attack - invalidate ALL sessions if reused
      const { checkTokenReuse } = require('../middleware/auth');
      const reuseDetected = await checkTokenReuse(refreshToken, user.id);
      
      if (reuseDetected) {
        logger.warn({ userId: user.id, ip: req.ip }, 'TOKEN_REUSE_ATTACK: All sessions invalidated');
        return res.status(401).json({ 
          success: false, 
          message: 'Security violation detected. All sessions have been invalidated. Please login again.' 
        });
      }
      
      await user.update({ refresh_token: null });
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user.id);
    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);
    await user.update({ refresh_token: hashedRefresh });

    // Mark old token as used for future reuse detection
    const { markTokenAsUsed } = require('../middleware/auth');
    markTokenAsUsed(refreshToken, user.id);

    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    logger.error({ err: error }, 'Token refresh error');
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Get user error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/auth/profile - Update profile
router.put('/profile', auth, [
  body('first_name').optional(),
  body('last_name').optional(),
  body('phone').optional()
], async (req, res) => {
  try {
    const { first_name, last_name, phone, location } = req.body;

    await req.user.update({
      first_name: first_name || req.user.first_name,
      last_name: last_name || req.user.last_name,
      phone: phone || req.user.phone,
      location: location || req.user.location
    });

    res.json({
      success: true,
      message: 'Profile updated',
      data: req.user
    });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Update profile error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', auth, [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    const isMatch = await bcrypt.compare(current_password, req.user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await req.user.update({ password: hashedPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Change password error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
