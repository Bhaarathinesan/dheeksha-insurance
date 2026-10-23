import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller.js';
import { requireAdminAuth } from '../middlewares/auth.middleware.js';
import { loginRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// POST /api/v1/auth/login (Rate limited: 5 req/min)
router.post('/login', loginRateLimiter, login);

// GET /api/v1/auth/me (Protected by Bearer JWT)
router.get('/me', requireAdminAuth, getMe);

export default router;
