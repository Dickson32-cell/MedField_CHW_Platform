const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const logger = require('../utils/logger');
const { addToBlacklist, isBlacklisted, invalidateUserTokens } = require('../config/redis');

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

    // Check if token is blacklisted (Redis-backed)
    const decoded = jwt.decode(token);
    if (decoded && decoded.userId) {
      const blacklisted = await isBlacklisted(token, decoded.userId);
      if (blacklisted) {
        return res.status(401).json({
          success: false,
          message: 'Token has been revoked'
        });
      }
    }
    
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
    req.userRole = user.role; // Store role for easy access
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
  // Use Redis for persistent token blacklist
  const fingerprint = generateTokenFingerprint(refreshToken);
  
  const exists = await isBlacklisted(fingerprint, `reuse:${userId}`);
  
  if (exists) {
    // Token reuse detected! This is a security breach.
    logger.warn({ userId, fingerprint }, 'REFRESH_TOKEN_REUSE_DETECTED: Invalidating all user sessions');
    
    // Invalidate ALL sessions for this user
    await User.update(
      { refresh_token: null },
      { where: { id: userId } }
    );
    
    // Invalidate all tokens via Redis
    await invalidateUserTokens(userId);
    
    return true; // Reuse detected
  }
  
  return false; // No reuse
};

/**
 * Mark a token as used (called after successful refresh)
 */
const markTokenAsUsed = async (refreshToken, userId) => {
  const fingerprint = generateTokenFingerprint(refreshToken);
  // Store in Redis with 7-day expiry (matches token refresh period)
  await addToBlacklist(fingerprint, `reuse:${userId}`, 86400 * 7);
};

/**
 * Logout - revoke current token
 */
const revokeToken = async (token, userId) => {
  await addToBlacklist(token, userId, 86400 * 7); // 7 days
};

/**
 * Logout all sessions for a user
 */
const revokeAllUserTokens = async (userId) => {
  await invalidateUserTokens(userId);
  await User.update(
    { refresh_token: null },
    { where: { id: userId } }
  );
};

module.exports = { 
  auth, 
  authorize, 
  checkTokenReuse, 
  markTokenAsUsed,
  revokeToken,
  revokeAllUserTokens,
  validateSecrets 
};