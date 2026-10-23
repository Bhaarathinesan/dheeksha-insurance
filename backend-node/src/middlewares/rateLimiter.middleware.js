import rateLimit from 'express-rate-limit';

/**
 * =============================================================================
 * REVERSE PROXY & CLIENT IP TOPOLOGY DOCUMENTATION
 * =============================================================================
 * express-rate-limit identifies clients using `req.ip`.
 *
 * PROXY ASSUMPTIONS & ARCHITECTURAL GUIDANCE:
 * 1. Direct / Standalone Hosting (No upstream reverse proxy):
 *    - Express must NOT trust forwarded headers (`app.set('trust proxy', false)`).
 *    - Otherwise, malicious clients can spoof `X-Forwarded-For` and bypass rate limits.
 *
 * 2. Single Reverse Proxy (e.g., Nginx, Caddy, Apache on the same host or Docker network):
 *    - Configure `app.set('trust proxy', 1)` in Express (trusting exactly 1 upstream proxy hop).
 *    - The reverse proxy must strip or overwrite `X-Forwarded-For` with the genuine client IP:
 *      `proxy_set_header X-Forwarded-For $remote_addr;`
 *
 * 3. Multi-Hop CDN / Reverse Proxy (e.g., Cloudflare -> Nginx -> Express):
 *    - `trust proxy` must match the specific trusted CIDR ranges (e.g. Cloudflare IP ranges)
 *      or the exact hop count.
 *
 * Universal hop counts or blind `trust proxy: true` MUST NOT be used in production
 * without verifying the actual hosting infrastructure.
 * =============================================================================
 */

/**
 * Login rate limiter: Max 5 attempts per 1 minute window per client IP.
 * Protects against brute-force password guessing attacks.
 * Never logs credentials or token values.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 5, // 5 requests per windowMs
  standardHeaders: 'draft-7', // Draft-7 RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded: 5 per 1 minute',
      detail: 'Too many login attempts. Please try again after 60 seconds.',
    });
  },
});

/**
 * Enquiry creation rate limiter: Max 5 submissions per 1 minute window per client IP.
 * Protects public enquiry creation endpoint from automated spam and abuse.
 */
export const enquiryRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 5, // 5 requests per windowMs
  standardHeaders: 'draft-7', // Draft-7 RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded: 5 per 1 minute',
      detail: 'Too many requests. Please try again after 60 seconds.',
    });
  },
});

/**
 * Resets enquiry rate limiter store keys for testing isolation.
 * @param {string} [key='127.0.0.1']
 */
export function resetEnquiryRateLimit(key = '127.0.0.1') {
  if (typeof enquiryRateLimiter.resetKey === 'function') {
    enquiryRateLimiter.resetKey(key);
    enquiryRateLimiter.resetKey('::1');
    enquiryRateLimiter.resetKey('::ffff:127.0.0.1');
  }
}

/**
 * Resets login rate limiter store keys for testing isolation.
 * @param {string} [key='127.0.0.1']
 */
export function resetLoginRateLimit(key = '127.0.0.1') {
  if (typeof loginRateLimiter.resetKey === 'function') {
    loginRateLimiter.resetKey(key);
    loginRateLimiter.resetKey('::1');
    loginRateLimiter.resetKey('::ffff:127.0.0.1');
  }
}

