import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { setPool, closePool } from '../src/config/database.js';
import { hashPassword } from '../src/utils/password.js';
import { createAccessToken } from '../src/utils/jwt.js';
import { validateConfig, resetConfig, getConfig } from '../src/config/env.js';

describe('Admin Authentication Endpoints & Flow (Mocked Database)', () => {
  let server;
  let baseUrl;
  let testAdmin;
  let capturedQueries = [];

  const adminEmail = 'testadmin@dheekshainsurance.com';
  const plainPassword = 'SuperSecretAdminPassword123!';
  const testSecretKey = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%';

  before(async () => {
    process.env.SECRET_KEY = testSecretKey;
    process.env.NODE_ENV = 'test';
    process.env.PORT = '8000';
    process.env.ACCESS_TOKEN_EXPIRE_MINUTES = '120';
    resetConfig();
    getConfig();

    const hashedPassword = await hashPassword(plainPassword);
    testAdmin = {
      id: 'mock-admin-uuid-1234',
      email: adminEmail,
      hashed_password: hashedPassword,
      created_at: new Date(),
    };

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await closePool();
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    capturedQueries = [];

    // Mock connection pool implementing parameterized query execution
    const mockPool = {
      async execute(sql, params) {
        capturedQueries.push({ sql, params });
        if (sql.includes('FROM admins WHERE email = ?')) {
          const queryEmail = params[0];
          if (queryEmail === testAdmin.email) {
            return [[testAdmin]];
          }
          return [[]];
        }
        return [[]];
      },
      async query(sql) {
        if (sql.includes('SELECT 1')) {
          return [[{ health_check: 1 }]];
        }
        return [[]];
      },
      async end() {},
    };

    setPool(mockPool);
  });

  test('POST /api/v1/auth/login succeeds with valid credentials (form-urlencoded)', async () => {
    const formData = new URLSearchParams();
    formData.append('username', adminEmail);
    formData.append('password', plainPassword);

    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(typeof body.access_token === 'string');
    assert.equal(body.token_type, 'bearer');

    // Verify response does NOT leak hashed_password or any admin fields
    assert.equal(body.hashed_password, undefined);
    assert.equal(body.password, undefined);

    // Verify parameterized SQL query was used
    assert.ok(capturedQueries.length > 0);
    const query = capturedQueries[0];
    assert.ok(query.sql.includes('WHERE email = ?'));
    assert.equal(query.params[0], adminEmail);
  });

  test('POST /api/v1/auth/login returns 400 for incorrect password', async () => {
    const formData = new URLSearchParams();
    formData.append('username', adminEmail);
    formData.append('password', 'WrongPassword999!');

    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.detail, 'Incorrect email or password');
  });

  test('POST /api/v1/auth/login returns 400 for non-existent admin email', async () => {
    const formData = new URLSearchParams();
    formData.append('username', 'nonexistent@example.com');
    formData.append('password', 'AnyPassword123!');

    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.detail, 'Incorrect email or password');
  });

  test('POST /api/v1/auth/login returns 422 for missing credentials', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: '',
    });

    assert.equal(res.status, 422);
    const body = await res.json();
    assert.ok(Array.isArray(body.detail));
    assert.ok(body.detail.length >= 2);
  });

  test('GET /api/v1/auth/me returns 200 with email for valid Bearer token', async () => {
    const token = createAccessToken(adminEmail, { secretKey: testSecretKey });

    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.email, adminEmail);
    assert.equal(body.hashed_password, undefined);
  });

  test('GET /api/v1/auth/me returns 401 with WWW-Authenticate header when token is missing', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`);

    assert.equal(res.status, 401);
    assert.equal(res.headers.get('www-authenticate'), 'Bearer');
    const body = await res.json();
    assert.equal(body.detail, 'Could not validate credentials');
  });

  test('GET /api/v1/auth/me returns 401 when token is invalid or expired', async () => {
    const expiredToken = createAccessToken(adminEmail, {
      expiresInMinutes: -5,
      secretKey: testSecretKey,
    });

    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });

    assert.equal(res.status, 401);
    assert.equal(res.headers.get('www-authenticate'), 'Bearer');
    const body = await res.json();
    assert.equal(body.detail, 'Could not validate credentials');
  });

  test('Login rate limiting throttles after 5 requests from same client IP', async () => {
    // Send 5 rapid login attempts
    const formData = new URLSearchParams();
    formData.append('username', adminEmail);
    formData.append('password', 'WrongPassword!');

    // First 5 requests should reach authentication (returns 400)
    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      assert.ok(res.status === 400 || res.status === 429);
    }

    // 6th request must trigger rate limit 429
    const rateLimitedRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    assert.equal(rateLimitedRes.status, 429);
    const body = await rateLimitedRes.json();
    assert.ok(body.error.includes('Rate limit exceeded'));
  });
});
