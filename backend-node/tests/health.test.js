import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { setPool, closePool } from '../src/config/database.js';

describe('Health Endpoint and Routing Tests (Mocked DB)', () => {
  let server;
  let baseUrl;

  before(async () => {
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
    setPool(null);
  });

  test('GET /api/health returns 503 when database is uninitialized or unavailable', async () => {
    setPool(null);
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 503);

    const body = await res.json();
    assert.equal(body.status, 'error');
    assert.equal(body.database, 'disconnected');
    assert.equal(body.message, 'Database is unavailable.');
  });

  test('GET /api/health returns 503 when database query throws error', async () => {
    const mockFailingPool = {
      async query() {
        const err = new Error('Database server connection lost');
        err.code = 'PROTOCOL_CONNECTION_LOST';
        throw err;
      },
      async end() {},
    };
    setPool(mockFailingPool);

    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 503);

    const body = await res.json();
    assert.equal(body.status, 'error');
    assert.equal(body.database, 'disconnected');
    // Ensure internal error details/stack trace are not leaked
    assert.equal(body.message, 'Database is unavailable.');
    assert.equal(body.code, undefined);
  });

  test('GET /api/health returns 200 when database is connected and responsive', async () => {
    const mockHealthyPool = {
      async query() {
        return [[{ health_check: 1 }]];
      },
      async end() {},
    };
    setPool(mockHealthyPool);

    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.status, 'success');
    assert.equal(body.database, 'connected');
    assert.equal(body.version, '1.0.0');
    assert.equal(body.message, 'Dheeksha Insurance API (Node.js) is running.');
  });

  test('GET unknown route returns 404 with exact detail format', async () => {
    const res = await fetch(`${baseUrl}/api/unknown-endpoint-404`);
    assert.equal(res.status, 404);

    const body = await res.json();
    assert.equal(body.detail, 'Not Found');
  });
});
