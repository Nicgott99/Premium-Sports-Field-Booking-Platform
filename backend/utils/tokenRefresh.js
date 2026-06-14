import logger from './logger.js';

/**
 * Token refresh and rotation management
 */

class TokenRefreshManager {
  constructor(options = {}) {
    this.refreshTokens = new Map();
    this.blacklistedTokens = new Set();
    this.tokenExpiry = options.tokenExpiry || 3600000; // 1 hour
    this.refreshExpiry = options.refreshExpiry || 2592000000; // 30 days
  }

  /**
   * Generate refresh token
   * @param {string} userId - User ID
   * @returns {object} Token pair
   */
  generateTokenPair(userId) {
    const accessToken = this.generateToken(32);
    const refreshToken = this.generateToken(64);

    this.refreshTokens.set(refreshToken, {
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.refreshExpiry,
      used: false,
    });

    logger.debug(`Token pair generated for user ${userId}`);

    return { accessToken, refreshToken };
  }

  /**
   * Generate token
   * @param {number} length - Token length
   * @returns {string}
   */
  generateToken(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {object} New tokens
   */
  refreshAccessToken(refreshToken) {
    const tokenData = this.refreshTokens.get(refreshToken);

    if (!tokenData) {
      throw new Error('Invalid refresh token');
    }

    if (Date.now() > tokenData.expiresAt) {
      this.refreshTokens.delete(refreshToken);
      throw new Error('Refresh token expired');
    }

    if (tokenData.used) {
      // Token reuse detected - likely compromised
      this.refreshTokens.delete(refreshToken);
      logger.warn(`Token reuse detected for user ${tokenData.userId}`);
      throw new Error('Token has already been used');
    }

    // Mark as used
    tokenData.used = true;

    const newAccessToken = this.generateToken(32);
    const newRefreshToken = this.generateToken(64);

    // Store new refresh token
    this.refreshTokens.set(newRefreshToken, {
      userId: tokenData.userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.refreshExpiry,
      used: false,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.tokenExpiry,
    };
  }

  /**
   * Revoke refresh token
   * @param {string} refreshToken - Token to revoke
   */
  revokeToken(refreshToken) {
    this.refreshTokens.delete(refreshToken);
    this.blacklistedTokens.add(refreshToken);
    logger.info('Token revoked');
  }

  /**
   * Revoke all user tokens
   * @param {string} userId - User ID
   */
  revokeAllUserTokens(userId) {
    const tokensToRevoke = [];

    for (const [token, data] of this.refreshTokens) {
      if (data.userId === userId) {
        tokensToRevoke.push(token);
      }
    }

    tokensToRevoke.forEach(token => this.revokeToken(token));
    logger.info(`All tokens revoked for user ${userId}`);
  }

  /**
   * Check if token is blacklisted
   * @param {string} token - Token to check
   * @returns {boolean}
   */
  isBlacklisted(token) {
    return this.blacklistedTokens.has(token);
  }

  /**
   * Cleanup expired tokens
   */
  cleanup() {
    const now = Date.now();
    let count = 0;

    for (const [token, data] of this.refreshTokens) {
      if (now > data.expiresAt) {
        this.refreshTokens.delete(token);
        count++;
      }
    }

    if (count > 0) {
      logger.debug(`Cleaned up ${count} expired tokens`);
    }
  }

  /**
   * Get token info
   * @param {string} token - Token
   * @returns {object} Token info
   */
  getTokenInfo(token) {
    return this.refreshTokens.get(token);
  }
}

export { TokenRefreshManager };

export const tokenRefreshManager = new TokenRefreshManager();

export default TokenRefreshManager;
