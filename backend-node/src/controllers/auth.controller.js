import { authenticateAdmin } from '../services/auth.service.js';
import { createAccessToken } from '../utils/jwt.js';

/**
 * Handles administrator OAuth2 password login.
 * Consumes application/x-www-form-urlencoded (username and password).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};

    // Validate presence of username and password fields
    const missingFields = [];
    if (!username || typeof username !== 'string' || !username.trim()) {
      missingFields.push({
        loc: ['body', 'username'],
        msg: 'Field required',
        type: 'value_error.missing',
      });
    }
    if (!password || typeof password !== 'string') {
      missingFields.push({
        loc: ['body', 'password'],
        msg: 'Field required',
        type: 'value_error.missing',
      });
    }

    if (missingFields.length > 0) {
      return res.status(422).json({
        detail: missingFields,
      });
    }

    // Authenticate administrator
    const admin = await authenticateAdmin(username.trim(), password);

    // Issue JWT access token
    const token = createAccessToken(admin.email);

    return res.status(200).json({
      access_token: token,
      token_type: 'bearer',
    });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({
        detail: 'Incorrect email or password',
      });
    }
    next(err);
  }
}

/**
 * Returns current authenticated administrator profile.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function getMe(req, res) {
  // req.admin populated by requireAdminAuth middleware
  return res.status(200).json({
    email: req.admin.email,
  });
}
