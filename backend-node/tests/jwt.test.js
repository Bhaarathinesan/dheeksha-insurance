import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { createAccessToken, verifyAccessToken } from '../src/utils/jwt.js';
import { validateConfig, resetConfig, getConfig } from '../src/config/env.js';

describe('JWT Utilities (HS256 Signing & Verification)', () => {
  const testSecretKey = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%';

  before(() => {
    process.env.SECRET_KEY = testSecretKey;
    process.env.NODE_ENV = 'test';
    process.env.PORT = '8000';
    process.env.ACCESS_TOKEN_EXPIRE_MINUTES = '120';
    resetConfig();
    getConfig();
  });

  test('createAccessToken creates a valid HS256 JWT with subject claim', () => {
    const email = 'admin@example.com';
    const token = createAccessToken(email, { secretKey: testSecretKey });
    assert.ok(typeof token === 'string');
    assert.equal(token.split('.').length, 3); // Header.Payload.Signature

    const payload = verifyAccessToken(token, { secretKey: testSecretKey });
    assert.equal(payload.sub, email);
    assert.ok(payload.exp > payload.iat);
  });

  test('verifyAccessToken rejects tokens with invalid signature', () => {
    const token = createAccessToken('admin@example.com', { secretKey: testSecretKey });
    const wrongSecret = 'another-secret-key-that-is-different-32-chars';

    assert.throws(
      () => verifyAccessToken(token, { secretKey: wrongSecret }),
      /Invalid or expired token/
    );
  });

  test('verifyAccessToken rejects expired tokens', async () => {
    // Expired immediately (-1 minute)
    const expiredToken = createAccessToken('admin@example.com', {
      expiresInMinutes: -1,
      secretKey: testSecretKey,
    });

    assert.throws(
      () => verifyAccessToken(expiredToken, { secretKey: testSecretKey }),
      /Invalid or expired token/
    );
  });

  test('verifyAccessToken rejects malformed and non-string tokens', () => {
    const malformed = [
      'not.a.valid.jwt',
      'Bearer eyJhbGciOi...',
      'random_string',
      '',
    ];

    for (const badToken of malformed) {
      assert.throws(
        () => verifyAccessToken(badToken, { secretKey: testSecretKey }),
        /Invalid or expired token|Token must be a valid non-empty string/
      );
    }

    assert.throws(() => verifyAccessToken(null), /Token must be a valid non-empty string/);
    assert.throws(() => verifyAccessToken(undefined), /Token must be a valid non-empty string/);
  });

  test('createAccessToken rejects empty or non-string subject', () => {
    assert.throws(() => createAccessToken(''), /JWT subject must be a valid non-empty string/);
    assert.throws(() => createAccessToken(null), /JWT subject must be a valid non-empty string/);
  });
});
