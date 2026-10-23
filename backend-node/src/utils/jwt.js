import jwt from 'jsonwebtoken';
import { getConfig } from '../config/env.js';

const JWT_ALGORITHM = 'HS256';

/**
 * Creates and signs an access token with HS256.
 *
 * @param {string} subject - Administrator email to encode as "sub"
 * @param {Object} [options={}]
 * @param {number} [options.expiresInMinutes] - Custom expiration in minutes
 * @param {string} [options.secretKey] - Custom secret key override (for testing)
 * @returns {string} Signed JWT token string
 */
export function createAccessToken(subject, options = {}) {
  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    throw new Error('JWT subject must be a valid non-empty string.');
  }

  let secretKey = options.secretKey;
  let expiryMinutes = options.expiresInMinutes;

  if (!secretKey || expiryMinutes === undefined) {
    const config = getConfig();
    if (!secretKey) secretKey = config.SECRET_KEY;
    if (expiryMinutes === undefined) expiryMinutes = config.ACCESS_TOKEN_EXPIRE_MINUTES;
  }

  return jwt.sign(
    { sub: subject.trim() },
    secretKey,
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: `${expiryMinutes}m`,
    }
  );
}

/**
 * Verifies a JWT access token.
 * Validates algorithm, expiration, and cryptographic signature.
 * Never leaks token contents or secret values in error messages.
 *
 * @param {string} token - Raw JWT token string
 * @param {Object} [options={}]
 * @param {string} [options.secretKey] - Custom secret key override (for testing)
 * @returns {Object} Decoded token payload
 * @throws {Error} Throws generic error when token is invalid or expired
 */
export function verifyAccessToken(token, options = {}) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a valid non-empty string.');
  }

  let secretKey = options.secretKey;
  if (!secretKey) {
    const config = getConfig();
    secretKey = config.SECRET_KEY;
  }

  try {
    const payload = jwt.verify(token, secretKey, {
      algorithms: [JWT_ALGORITHM],
    });

    if (!payload.sub || typeof payload.sub !== 'string') {
      throw new Error('Token missing valid subject claim.');
    }

    return payload;
  } catch (err) {
    // Map any jsonwebtoken errors (TokenExpiredError, JsonWebTokenError) to generic message
    throw new Error('Invalid or expired token.');
  }
}
