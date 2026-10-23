import { getPool } from '../config/database.js';
import { verifyPassword } from '../utils/password.js';

/**
 * Finds an administrator by email using a parameterized SQL query.
 *
 * @param {string} email
 * @returns {Promise<{ id: string, email: string, hashed_password: string, created_at: Date } | null>}
 */
export async function findAdminByEmail(email) {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const pool = getPool();
  if (!pool) {
    throw new Error('Database pool has not been initialized.');
  }

  const [rows] = await pool.execute(
    'SELECT id, email, hashed_password, created_at FROM admins WHERE email = ? LIMIT 1;',
    [email.trim().toLowerCase()]
  );

  return rows.length > 0 ? rows[0] : null;
}

/**
 * Authenticates an administrator by verifying credentials.
 * Returns safe administrator profile (excluding hashed_password).
 * Never leaks whether the email address exists or not.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ id: string, email: string }>} Safe admin object
 * @throws {Error} Throws with generic message "Incorrect email or password" on failure
 */
export async function authenticateAdmin(email, password) {
  if (!email || !password) {
    const error = new Error('Incorrect email or password');
    error.statusCode = 400;
    throw error;
  }

  const admin = await findAdminByEmail(email);
  if (!admin) {
    const error = new Error('Incorrect email or password');
    error.statusCode = 400;
    throw error;
  }

  const passwordValid = await verifyPassword(password, admin.hashed_password);
  if (!passwordValid) {
    const error = new Error('Incorrect email or password');
    error.statusCode = 400;
    throw error;
  }

  // Return only safe fields - NEVER expose hashed_password
  return {
    id: admin.id,
    email: admin.email,
  };
}
