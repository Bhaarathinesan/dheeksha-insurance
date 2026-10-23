import bcrypt from 'bcryptjs';

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt with work factor 12.
 * Never logs plaintext passwords or password hashes.
 *
 * @param {string} password - Plaintext password
 * @returns {Promise<string>} Bcrypt hash
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string.');
  }
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a plaintext password against a stored bcrypt hash.
 * Fully compatible with existing Python Passlib bcrypt hashes ($2b$, $2a$).
 * Safely handles invalid hash formats without crashing.
 *
 * @param {string} password - Plaintext password
 * @param {string} hash - Stored bcrypt hash
 * @returns {Promise<boolean>} True if password matches hash, false otherwise
 */
export async function verifyPassword(password, hash) {
  if (!password || typeof password !== 'string' || !hash || typeof hash !== 'string') {
    return false;
  }
  try {
    return await bcrypt.compare(password, hash);
  } catch (err) {
    // Malformed or invalid hash formats return false cleanly
    return false;
  }
}
