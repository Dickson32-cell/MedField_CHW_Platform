const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const logger = require('../utils/logger');

// In-memory store for used refresh token fingerprints (production should use Redis/DB)
const usedTokenFingerprints = new Map();

/**
 * Validate that required secrets are present - NO fallbacks
 */
const validateSecrets = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('CRITICAL SECURITY: JWT_SECRET environment variable is not set. Server cannot start without it.');
  }
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('CRITICAL SECURITY: REFRESH_TOKEN_SECRET environment variable is not set. Server cannot start without it.');
  }
};

// Validate secrets on module load
validateSecrets();

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT_SECRET exists (should already be validated at startup)
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    next();
  };
};

/**
 * Generate fingerprint for token reuse detection
 */
const generateTokenFingerprint = (token) => {
  return token.substring(0, 8) + '-' + token.length;
};

/**
 * Check if refresh token has been reused (already invalidated)
 * If reused, invalidate ALL user sessions for security
 */
const checkTokenReuse = async (refreshToken, userId) => {
  const fingerprint = generateTokenFingerprint(refreshToken);
  
  if (usedTokenFingerprints.has(fingerprint)) {
    // Token reuse detected! This is a security breach.
    logger.warn({ userId, fingerprint }, 'REFRESH_TOKEN_REUSE_DETECTED: Invalidating all user sessions');
    
    // Invalidate ALL sessions for this user by clearing refresh token
    await User.update(
      { refresh_token: null },
      { where: { id: userId } }
    );
    
    // Mark this fingerprint as used
    usedTokenFingerprints.set(fingerprint, {
      usedAt: new Date(),
      userId
    });
    
    return true; // Reuse detected
  }
  
  return false; // No reuse
};

/**
 * Mark a token as used (called after successful refresh)
 */
const markTokenAsUsed = (refreshToken, userId) => {
  const fingerprint = generateTokenFingerprint(refreshToken);
  usedTokenFingerprints.set(fingerprint, {
    usedAt: new Date(),
    userId
  });
};

module.exports = { auth, authorize, checkTokenReuse, markTokenAsUsed, validateSecrets };
