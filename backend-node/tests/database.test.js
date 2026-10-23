import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  initPool,
  getPool,
  setPool,
  closePool,
  checkDatabaseHealth,
} from '../src/config/database.js';

describe('Database Pool and Health-Check (Mocked Infrastructure)', () => {
  beforeEach(() => {
    setPool(null);
  });

  afterEach(async () => {
    await closePool();
  });

  test('Graceful pool shutdown does not throw when no pool was initialized', async () => {
    assert.equal(getPool(), null);
    await assert.doesNotReject(async () => {
      await closePool();
    });
    assert.equal(getPool(), null);
  });

  test('initPool rejects invalid or empty connection URLs', () => {
    assert.throws(() => initPool(''), /Valid connection URL required/);
    assert.throws(() => initPool(null), /Valid connection URL required/);
    assert.throws(() => initPool(123), /Valid connection URL required/);
  });

  test('checkDatabaseHealth reports disconnected when pool is null', async () => {
    setPool(null);
    const result = await checkDatabaseHealth();
    assert.equal(result.connected, false);
    assert.equal(result.message, 'Database pool is not initialized.');
  });

  test('checkDatabaseHealth reports connected when SELECT 1 succeeds', async () => {
    let queryExecuted = false;
    const mockPool = {
      async query(sql) {
        if (sql.includes('SELECT 1')) {
          queryExecuted = true;
          return [[{ health_check: 1 }]];
        }
        throw new Error('Unexpected query');
      },
      async end() {},
    };

    setPool(mockPool);
    const result = await checkDatabaseHealth();
    assert.equal(result.connected, true);
    assert.equal(result.message, 'Database is reachable.');
    assert.equal(queryExecuted, true);
  });

  test('checkDatabaseHealth reports disconnected when database query fails', async () => {
    const mockPool = {
      async query() {
        const err = new Error('ECONNREFUSED');
        err.code = 'ECONNREFUSED';
        throw err;
      },
      async end() {},
    };

    setPool(mockPool);
    const result = await checkDatabaseHealth();
    assert.equal(result.connected, false);
    assert.equal(result.message, 'Database is unavailable.');
  });

  test('closePool safely ends active pool and resets to null', async () => {
    let poolEnded = false;
    const mockPool = {
      async end() {
        poolEnded = true;
      },
    };

    setPool(mockPool);
    assert.equal(getPool(), mockPool);
    await closePool();
    assert.equal(poolEnded, true);
    assert.equal(getPool(), null);
  });
});
