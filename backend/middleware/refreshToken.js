const jwt = require('jsonwebtoken');
const RefreshToken = require('../models').RefreshToken;
const User = require('../models').User;

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';

/**
 * Generate access and refresh tokens for a user
 */
async function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRY }
  );

  // Store refresh token in database
  await RefreshToken.create({
    token: refreshToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  return { accessToken, refreshToken };
}

/**
 * Verify and refresh access token
 */
async function refreshAccessToken(refreshToken) {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    // Check if token exists in database and is not revoked
    const storedToken = await RefreshToken.findOne({
      where: { token: refreshToken, revoked: false }
    });

    if (!storedToken) {
      throw new Error('Refresh token revoked or expired');
    }

    // Get user
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_EXPIRY }
    );

    return { accessToken };
  } catch (error) {
    throw new Error('Invalid refresh token: ' + error.message);
  }
}

/**
 * Revoke a refresh token (logout)
 */
async function revokeRefreshToken(refreshToken) {
  await RefreshToken.update(
    { revoked: true },
    { where: { token: refreshToken } }
  );
}

/**
 * Revoke all refresh tokens for a user
 */
async function revokeAllUserTokens(userId) {
  await RefreshToken.update(
    { revoked: true },
    { where: { userId } }
  );
}

/**
 * Cleanup expired tokens (call periodically)
 */
async function cleanupExpiredTokens() {
  await RefreshToken.destroy({
    where: {
      expiresAt: { [require('sequelize').Op.lt]: new Date() }
    }
  });
}

module.exports = {
  generateTokens,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanupExpiredTokens
};
