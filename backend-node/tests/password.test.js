import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/utils/password.js';

describe('Password Utility & Bcrypt Compatibility', () => {
  const plainPassword = 'CorrectHorseBatteryStaple123!';
  // Genuine Passlib bcrypt hash generated with Python passlib.context.CryptContext(schemes=["bcrypt"])
  // Password: "testpassword"
  const passlibPythonHash = '$2b$12$HLOXiVkc2IlWDvLiGYDJK.aMrkdpiYw64yKGXT3JZRwoZLDneiAhu';

  test('hashPassword creates a valid bcrypt hash with work factor 12', async () => {
    const hash = await hashPassword(plainPassword);
    assert.ok(typeof hash === 'string');
    // Bcrypt hashes start with $2a$, $2b$, or $2y$ followed by work factor (12)
    assert.match(hash, /^\$2[aby]\$12\$/);
  });

  test('verifyPassword returns true for matching password and hash', async () => {
    const hash = await hashPassword(plainPassword);
    const matches = await verifyPassword(plainPassword, hash);
    assert.equal(matches, true);
  });

  test('verifyPassword returns false for incorrect password', async () => {
    const hash = await hashPassword(plainPassword);
    const matches = await verifyPassword('WrongPassword999!', hash);
    assert.equal(matches, false);
  });

  test('verifyPassword verifies existing Python Passlib bcrypt hashes seamlessly', async () => {
    const matches = await verifyPassword('testpassword', passlibPythonHash);
    assert.equal(matches, true);

    const wrongMatches = await verifyPassword('not-the-password', passlibPythonHash);
    assert.equal(wrongMatches, false);
  });

  test('verifyPassword handles malformed bcrypt hashes safely without throwing', async () => {
    const malformedHashes = [
      'not-a-hash',
      '$2b$99$invalidworkfactor',
      'plain_text_password',
      '',
      null,
      undefined,
      12345,
    ];

    for (const badHash of malformedHashes) {
      const result = await verifyPassword('somepassword', badHash);
      assert.equal(result, false, `Expected false for malformed hash: ${badHash}`);
    }
  });

  test('hashPassword rejects empty or non-string inputs', async () => {
    await assert.rejects(() => hashPassword(''), /Password must be a non-empty string/);
    await assert.rejects(() => hashPassword(null), /Password must be a non-empty string/);
    await assert.rejects(() => hashPassword(undefined), /Password must be a non-empty string/);
  });
});
