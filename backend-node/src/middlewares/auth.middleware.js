import { verifyAccessToken } from '../utils/jwt.js';
import { findAdminByEmail } from '../services/auth.service.js';
import { getPool } from '../config/database.js';

/**
 * Authentication middleware validating Authorization: Bearer <token>.
 * Rejects missing, malformed, or expired tokens with HTTP 401.
 * Never trusts client-supplied identity from request bodies or headers.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    res.set('WWW-Authenticate', 'Bearer');
    return res.status(401).json({
      detail: 'Could not validate credentials',
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    res.set('WWW-Authenticate', 'Bearer');
    return res.status(401).json({
      detail: 'Could not validate credentials',
    });
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    res.set('WWW-Authenticate', 'Bearer');
    return res.status(401).json({
      detail: 'Could not validate credentials',
    });
  }

  // If a database pool is initialized, verify admin exists in the database
  const pool = getPool();
  if (pool) {
    try {
      const admin = await findAdminByEmail(payload.sub);
      if (!admin) {
        res.set('WWW-Authenticate', 'Bearer');
        return res.status(401).json({
          detail: 'Could not validate credentials',
        });
      }
      req.admin = {
        id: admin.id,
        email: admin.email,
      };
    } catch (err) {
      console.error('Error verifying admin in database during authentication:', err.code || err.name);
      res.set('WWW-Authenticate', 'Bearer');
      return res.status(401).json({
        detail: 'Could not validate credentials',
      });
    }
  } else {
    // Isolated mode: attach verified token subject
    req.admin = {
      email: payload.sub,
    };
  }

  next();
}
