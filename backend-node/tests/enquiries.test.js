import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { setPool, closePool } from '../src/config/database.js';
import { createAccessToken } from '../src/utils/jwt.js';
import { hashPassword } from '../src/utils/password.js';
import { resetConfig, getConfig } from '../src/config/env.js';
import { resetEnquiryRateLimit } from '../src/middlewares/rateLimiter.middleware.js';

describe('Enquiry Management API Endpoints & CRUD Flow (Mock Database)', () => {
  let server;
  let baseUrl;
  let adminToken;
  let testAdmin;

  // In-memory mock database state
  let enquiriesStore = [];
  let notesStore = [];
  let capturedQueries = [];
  let simulateError = false;
  let simulateTxError = false;
  let rollbackCalled = false;

  const adminEmail = 'admin@dheekshainsurance.com';
  const testSecretKey = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%';

  before(async () => {
    process.env.SECRET_KEY = testSecretKey;
    process.env.NODE_ENV = 'test';
    process.env.PORT = '8000';
    process.env.ACCESS_TOKEN_EXPIRE_MINUTES = '120';
    resetConfig();
    getConfig();

    const hashedPassword = await hashPassword('AdminSecurePass123!');
    testAdmin = {
      id: 'admin-uuid-0001',
      email: adminEmail,
      hashed_password: hashedPassword,
      created_at: new Date(),
    };

    adminToken = createAccessToken(adminEmail, { secretKey: testSecretKey });

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
    resetEnquiryRateLimit('127.0.0.1');
    enquiriesStore = [];
    notesStore = [];
    capturedQueries = [];
    simulateError = false;
    simulateTxError = false;
    rollbackCalled = false;

    // Helper for executing queries against mock in-memory database
    const executeMockQuery = async (sql, params = []) => {
      capturedQueries.push({ sql, params });

      if (simulateError) {
        const err = new Error('Database connection failed');
        err.code = 'ECONNRESET';
        throw err;
      }

      // 1. Admin lookup for requireAdminAuth
      if (sql.includes('FROM admins WHERE email = ?')) {
        const email = params[0];
        if (email === testAdmin.email) {
          return [[testAdmin]];
        }
        return [[]];
      }

      // 2. Insert Enquiry
      if (sql.includes('INSERT INTO enquiries')) {
        const [
          id, full_name, mobile_number, whatsapp_number,
          vehicle_type, vehicle_registration_number,
          requirement, message, status, created_at, updated_at
        ] = params;

        const row = {
          id,
          full_name,
          mobile_number,
          whatsapp_number: whatsapp_number ?? null,
          vehicle_type,
          vehicle_registration_number: vehicle_registration_number ?? null,
          requirement,
          message: message ?? null,
          status: status || 'NEW',
          created_at: new Date(created_at),
          updated_at: new Date(updated_at),
        };
        enquiriesStore.push(row);
        return [{ affectedRows: 1 }];
      }

      // 3. Select single enquiry by ID
      if (sql.includes('SELECT') && sql.includes('FROM enquiries') && sql.includes('WHERE id = ?')) {
        const id = params[0];
        const found = enquiriesStore.find((e) => e.id === id);
        return [found ? [{ ...found }] : []];
      }

      // 4. Select enquiries list with filters, sort, skip, limit
      if (sql.includes('SELECT') && sql.includes('FROM enquiries') && !sql.includes('WHERE id = ?')) {
        let results = [...enquiriesStore];

        // Status filter
        if (sql.includes('status = ?')) {
          const statusParam = params[0];
          results = results.filter((e) => e.status === statusParam);
        }

        // Search filter
        if (sql.includes('LIKE')) {
          // Find the search pattern from params (e.g. %query%)
          const searchParam = params.find((p) => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
          if (searchParam) {
            const rawTerm = searchParam.slice(1, -1).toLowerCase().replace(/\\([%_\\])/g, '$1');
            results = results.filter((e) => {
              const nameMatch = (e.full_name || '').toLowerCase().includes(rawTerm);
              const phoneMatch = (e.mobile_number || '').includes(rawTerm);
              const waMatch = (e.whatsapp_number || '').includes(rawTerm);
              const regMatch = (e.vehicle_registration_number || '').toLowerCase().includes(rawTerm);
              return nameMatch || phoneMatch || waMatch || regMatch;
            });
          }
        }

        // Sorting
        if (sql.includes('ORDER BY created_at ASC')) {
          results.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        } else {
          results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        // Limit & offset from sql string
        const limitMatch = sql.match(/LIMIT\s+(\d+)\s+OFFSET\s+(\d+)/);
        if (limitMatch) {
          const limit = parseInt(limitMatch[1], 10);
          const offset = parseInt(limitMatch[2], 10);
          results = results.slice(offset, offset + limit);
        }

        return [results.map((r) => ({ ...r }))];
      }

      // 5. Select notes for enquiry_id IN (...) or enquiry_id = ?
      if (sql.includes('FROM enquiry_notes')) {
        if (sql.includes('WHERE enquiry_id = ?')) {
          const id = params[0];
          const matching = notesStore
            .filter((n) => n.enquiry_id === id)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          return [matching.map((n) => ({ ...n }))];
        }

        if (sql.includes('WHERE enquiry_id IN')) {
          const ids = params;
          const matching = notesStore
            .filter((n) => ids.includes(n.enquiry_id))
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          return [matching.map((n) => ({ ...n }))];
        }
      }

      // 6. Update enquiry status & updated_at
      if (sql.includes('UPDATE enquiries SET status = ?')) {
        const [status, updated_at, id] = params;
        const target = enquiriesStore.find((e) => e.id === id);
        if (target) {
          target.status = status;
          target.updated_at = new Date(updated_at);
        }
        return [{ affectedRows: target ? 1 : 0 }];
      }

      // 7. Update enquiries updated_at only
      if (sql.includes('UPDATE enquiries SET updated_at = ? WHERE id = ?')) {
        const [updated_at, id] = params;
        const target = enquiriesStore.find((e) => e.id === id);
        if (target) {
          target.updated_at = new Date(updated_at);
        }
        return [{ affectedRows: target ? 1 : 0 }];
      }

      // 8. Insert enquiry note
      if (sql.includes('INSERT INTO enquiry_notes')) {
        const [id, enquiry_id, text, created_at] = params;
        const note = {
          id,
          enquiry_id,
          text,
          created_at: new Date(created_at),
        };
        notesStore.push(note);
        return [{ affectedRows: 1 }];
      }

      // 9. Delete enquiry
      if (sql.includes('DELETE FROM enquiries WHERE id = ?')) {
        const id = params[0];
        const initialCount = enquiriesStore.length;
        enquiriesStore = enquiriesStore.filter((e) => e.id !== id);
        // Cascade delete notes
        notesStore = notesStore.filter((n) => n.enquiry_id !== id);
        return [{ affectedRows: initialCount - enquiriesStore.length }];
      }

      return [[]];
    };

    const mockPool = {
      execute: executeMockQuery,
      query: async (sql) => {
        if (sql.includes('SELECT 1')) return [[{ health_check: 1 }]];
        return [[]];
      },
      getConnection: async () => {
        return {
          async beginTransaction() {},
          async commit() {},
          async rollback() {
            rollbackCalled = true;
          },
          async execute(sql, params) {
            if (simulateTxError) {
              const err = new Error('Transaction execution failure');
              err.code = 'ER_LOCK_DEADLOCK';
              throw err;
            }
            return executeMockQuery(sql, params);
          },
          release() {},
        };
      },
      async end() {},
    };

    setPool(mockPool);
  });

  // =========================================================================
  // 1. PUBLIC ENQUIRY CREATION TESTS (POST /api/v1/enquiries)
  // =========================================================================

  test('POST /api/v1/enquiries successfully creates a valid enquiry with status NEW', async () => {
    const payload = {
      full_name: 'Murugan Palanisamy',
      mobile_number: '9876543210',
      whatsapp_number: '9876543210',
      vehicle_type: 'two-wheeler',
      vehicle_registration_number: 'TN 38 AB 1234',
      requirement: 'new-insurance',
      message: 'Need comprehensive policy for new bike.',
    };

    const res = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(typeof body.id === 'string' && body.id.length === 36);
    assert.equal(body.full_name, payload.full_name);
    assert.equal(body.mobile_number, payload.mobile_number);
    assert.equal(body.whatsapp_number, payload.whatsapp_number);
    assert.equal(body.vehicle_type, payload.vehicle_type);
    assert.equal(body.vehicle_registration_number, payload.vehicle_registration_number);
    assert.equal(body.requirement, payload.requirement);
    assert.equal(body.message, payload.message);
    assert.equal(body.status, 'NEW');
    assert.deepEqual(body.notes, []);
    assert.ok(new Date(body.created_at).getTime() > 0);
    assert.ok(new Date(body.updated_at).getTime() > 0);

    // Verify parameterized SQL was used
    const insertQuery = capturedQueries.find((q) => q.sql.includes('INSERT INTO enquiries'));
    assert.ok(insertQuery);
    assert.equal(insertQuery.params[1], payload.full_name);
  });

  test('POST /api/v1/enquiries supports Tamil Unicode customer names and messages without corruption', async () => {
    const payload = {
      full_name: 'பாரதிநேசன்',
      mobile_number: '9876543210',
      whatsapp_number: '9876543210',
      vehicle_type: 'two-wheeler',
      vehicle_registration_number: 'TN 49 AB 1234',
      requirement: 'new-insurance',
      message: 'எனது புதிய இருசக்கர வாகனத்திற்கு விரிவான காப்பீடு தேவை.',
    };

    const res = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.full_name, 'பாரதிநேசன்');
    assert.equal(body.message, 'எனது புதிய இருசக்கர வாகனத்திற்கு விரிவான காப்பீடு தேவை.');
    assert.equal(body.status, 'NEW');
  });

  test('POST /api/v1/enquiries rejects missing required fields with HTTP 422', async () => {
    const payload = {
      full_name: 'Missing Fields User',
      // missing mobile_number, vehicle_type, requirement
    };

    const res = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 422);
    const body = await res.json();
    assert.ok(Array.isArray(body.detail));
    const locs = body.detail.map((d) => d.loc[1]);
    assert.ok(locs.includes('mobile_number'));
    assert.ok(locs.includes('vehicle_type'));
    assert.ok(locs.includes('requirement'));
  });

  test('POST /api/v1/enquiries rejects invalid mobile numbers with HTTP 422', async () => {
    const invalidPhones = ['123', '987654321', '98765432100', 'abcdefghij', ''];

    for (const phone of invalidPhones) {
      const res = await fetch(`${baseUrl}/api/v1/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Test Customer',
          mobile_number: phone,
          vehicle_type: 'two-wheeler',
          requirement: 'new-insurance',
        }),
      });

      assert.equal(res.status, 422, `Expected 422 for phone: "${phone}"`);
      const body = await res.json();
      assert.ok(body.detail.some((d) => d.loc[1] === 'mobile_number'));
    }
  });

  test('POST /api/v1/enquiries rejects invalid vehicle types with HTTP 422', async () => {
    const res = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Test Customer',
        mobile_number: '9876543210',
        vehicle_type: 'flying-car', // Invalid
        requirement: 'new-insurance',
      }),
    });

    assert.equal(res.status, 422);
    const body = await res.json();
    assert.ok(body.detail.some((d) => d.loc[1] === 'vehicle_type'));
  });

  test('POST /api/v1/enquiries rejects invalid requirements with HTTP 422', async () => {
    const res = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Test Customer',
        mobile_number: '9876543210',
        vehicle_type: 'two-wheeler',
        requirement: 'crypto-loan', // Invalid
      }),
    });

    assert.equal(res.status, 422);
    const body = await res.json();
    assert.ok(body.detail.some((d) => d.loc[1] === 'requirement'));
  });

  test('POST /api/v1/enquiries rejects field lengths exceeding maximum bounds with HTTP 422', async () => {
    // 1. full_name too short (<2 chars)
    const resShortName = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'A',
        mobile_number: '9876543210',
        vehicle_type: 'two-wheeler',
        requirement: 'new-insurance',
      }),
    });
    assert.equal(resShortName.status, 422);

    // 2. vehicle_registration_number > 50 chars
    const resLongReg = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Test User',
        mobile_number: '9876543210',
        vehicle_type: 'two-wheeler',
        vehicle_registration_number: 'A'.repeat(51),
        requirement: 'new-insurance',
      }),
    });
    assert.equal(resLongReg.status, 422);

    // 3. message > 1000 chars
    const resLongMsg = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Test User',
        mobile_number: '9876543210',
        vehicle_type: 'two-wheeler',
        requirement: 'new-insurance',
        message: 'M'.repeat(1001),
      }),
    });
    assert.equal(resLongMsg.status, 422);
  });

  test('POST /api/v1/enquiries rejects malformed JSON with HTTP 422', async () => {
    const res = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'this is not valid json',
    });

    assert.equal(res.status, 422);
    const body = await res.json();
    assert.ok(Array.isArray(body.detail));
    assert.equal(body.detail[0].loc[0], 'body');
  });

  test('POST /api/v1/enquiries rate limiting enforces 5 requests per minute', async () => {
    const payload = {
      full_name: 'Rate Limit Tester',
      mobile_number: '9876543210',
      vehicle_type: 'two-wheeler',
      requirement: 'new-insurance',
    };

    // Rapidly submit requests to exceed rate limit
    let hitRateLimit = false;
    for (let i = 0; i < 7; i++) {
      const res = await fetch(`${baseUrl}/api/v1/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) {
        hitRateLimit = true;
        const body = await res.json();
        assert.ok(body.error.includes('Rate limit exceeded: 5 per 1 minute'));
        break;
      }
    }

    assert.ok(hitRateLimit, 'Expected 429 rate limit to be triggered');
  });

  // =========================================================================
  // 2. ADMIN ENQUIRY LISTING & SEARCH TESTS (GET /api/v1/enquiries)
  // =========================================================================

  test('GET /api/v1/enquiries rejects unauthorized requests with HTTP 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/enquiries`);
    assert.equal(res.status, 401);
    assert.equal(res.headers.get('www-authenticate'), 'Bearer');
    const body = await res.json();
    assert.equal(body.detail, 'Could not validate credentials');
  });

  test('GET /api/v1/enquiries rejects invalid or expired tokens with HTTP 401', async () => {
    const expiredToken = createAccessToken(adminEmail, {
      expiresInMinutes: -10,
      secretKey: testSecretKey,
    });

    const res = await fetch(`${baseUrl}/api/v1/enquiries`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert.equal(res.status, 401);
  });

  test('GET /api/v1/enquiries succeeds for authorized admin and returns list with eager-loaded notes', async () => {
    // Seed test enquiry and note
    const createRes = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Ravi Kumar',
        mobile_number: '9876543210',
        vehicle_type: 'private-car',
        requirement: 'renewal',
      }),
    });
    const created = await createRes.json();

    const res = await fetch(`${baseUrl}/api/v1/enquiries`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body));
    const found = body.find((e) => e.id === created.id);
    assert.ok(found);
    assert.equal(found.full_name, 'Ravi Kumar');
    assert.ok(Array.isArray(found.notes));
  });

  test('GET /api/v1/enquiries status filtering filters correctly and rejects invalid status with 422', async () => {
    // 1. Invalid status query parameter returns 422
    const invalidRes = await fetch(`${baseUrl}/api/v1/enquiries?status=INVALID_STATUS`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(invalidRes.status, 422);
    const invalidBody = await invalidRes.json();
    assert.ok(invalidBody.detail.some((d) => d.loc[1] === 'status'));

    // 2. Valid status filter returns matching status
    const validRes = await fetch(`${baseUrl}/api/v1/enquiries?status=NEW`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(validRes.status, 200);
    const results = await validRes.json();
    assert.ok(results.every((e) => e.status === 'NEW'));
  });

  test('GET /api/v1/enquiries search filters by name, mobile, registration, and escapes wildcards', async () => {
    // Create distinct test enquiries
    await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Bhaarathinesan Kumar',
        mobile_number: '9876543210',
        vehicle_type: 'two-wheeler',
        vehicle_registration_number: 'TN 38 Z 9999',
        requirement: 'new-insurance',
      }),
    });

    await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Ramesh Sharma',
        mobile_number: '9123456789',
        vehicle_type: 'private-car',
        vehicle_registration_number: 'TN 01 AA 0001',
        requirement: 'renewal',
      }),
    });

    // 1. Partial name search
    const resName = await fetch(`${baseUrl}/api/v1/enquiries?search=sharma`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(resName.status, 200);
    const nameResults = await resName.json();
    assert.ok(nameResults.some((e) => e.full_name === 'Ramesh Sharma'));
    assert.ok(!nameResults.some((e) => e.full_name === 'Bhaarathinesan Kumar'));

    // 2. Phone search
    const resPhone = await fetch(`${baseUrl}/api/v1/enquiries?search=9123456789`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(resPhone.status, 200);
    const phoneResults = await resPhone.json();
    assert.ok(phoneResults.some((e) => e.mobile_number === '9123456789'));

    // 3. Registration search
    const resReg = await fetch(`${baseUrl}/api/v1/enquiries?search=TN%2038`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(resReg.status, 200);
    const regResults = await resReg.json();
    assert.ok(regResults.some((e) => e.vehicle_registration_number === 'TN 38 Z 9999'));

    // 4. Wildcard escaping: search '%' should be escaped and not match everything blindly
    await fetch(`${baseUrl}/api/v1/enquiries?search=%`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchQuery = capturedQueries.find(
      (q) => q.sql.includes('LIKE') && q.params.some((p) => typeof p === 'string' && p.includes('\\%'))
    );
    assert.ok(searchQuery, 'Expected search query with escaped wildcard');
  });

  test('GET /api/v1/enquiries validates pagination boundaries (skip and limit)', async () => {
    // 1. Negative skip returns 422
    const resNegSkip = await fetch(`${baseUrl}/api/v1/enquiries?skip=-1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(resNegSkip.status, 422);

    // 2. Zero limit returns 422 (limit must be >= 1)
    const resZeroLimit = await fetch(`${baseUrl}/api/v1/enquiries?limit=0`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(resZeroLimit.status, 422);

    // 3. Limit > 100 returns 422 (limit must be <= 100)
    const resExcessLimit = await fetch(`${baseUrl}/api/v1/enquiries?limit=101`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(resExcessLimit.status, 422);

    // 4. Invalid sort_by returns 422
    const resInvalidSort = await fetch(`${baseUrl}/api/v1/enquiries?sort_by=random`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(resInvalidSort.status, 422);

    // 5. Valid pagination skip=0 and limit=50 returns 200
    const resValid = await fetch(`${baseUrl}/api/v1/enquiries?skip=0&limit=50&sort_by=oldest`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(resValid.status, 200);
  });

  // =========================================================================
  // 3. SINGLE ENQUIRY RETRIEVAL (GET /api/v1/enquiries/:id)
  // =========================================================================

  test('GET /api/v1/enquiries/:id retrieves enquiry with chronological notes', async () => {
    // Create enquiry
    const createRes = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Single Enquiry Tester',
        mobile_number: '9876543210',
        vehicle_type: 'commercial',
        requirement: 'claim',
      }),
    });
    const created = await createRes.json();

    // Fetch single
    const res = await fetch(`${baseUrl}/api/v1/enquiries/${created.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, created.id);
    assert.equal(body.full_name, 'Single Enquiry Tester');
    assert.deepEqual(body.notes, []);
  });

  test('GET /api/v1/enquiries/:id returns HTTP 404 for non-existent enquiry ID', async () => {
    const res = await fetch(`${baseUrl}/api/v1/enquiries/00000000-0000-0000-0000-000000000000`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.detail, 'Enquiry not found');
  });

  // =========================================================================
  // 4. UPDATE STATUS & ADD NOTES (PATCH /api/v1/enquiries/:id)
  // =========================================================================

  test('PATCH /api/v1/enquiries/:id updates status and appends chronological notes', async () => {
    // Create initial enquiry
    const createRes = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Update Lifecycle Tester',
        mobile_number: '9876543210',
        vehicle_type: 'private-car',
        requirement: 'renewal',
      }),
    });
    const created = await createRes.json();
    const enquiryId = created.id;

    // 1. Transition NEW -> IN_PROGRESS with note
    const patchRes1 = await fetch(`${baseUrl}/api/v1/enquiries/${enquiryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'IN_PROGRESS',
        new_note: 'Called customer, shared quote via WhatsApp.',
      }),
    });

    assert.equal(patchRes1.status, 200);
    const data1 = await patchRes1.json();
    assert.equal(data1.status, 'IN_PROGRESS');
    assert.equal(data1.notes.length, 1);
    assert.equal(data1.notes[0].text, 'Called customer, shared quote via WhatsApp.');

    // 2. Transition IN_PROGRESS -> COMPLETED with second note
    const patchRes2 = await fetch(`${baseUrl}/api/v1/enquiries/${enquiryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'COMPLETED',
        new_note: 'Policy issued successfully.',
      }),
    });

    assert.equal(patchRes2.status, 200);
    const data2 = await patchRes2.json();
    assert.equal(data2.status, 'COMPLETED');
    assert.equal(data2.notes.length, 2);
    assert.equal(data2.notes[0].text, 'Called customer, shared quote via WhatsApp.');
    assert.equal(data2.notes[1].text, 'Policy issued successfully.');
  });

  test('PATCH /api/v1/enquiries/:id returns 400 when no data is provided to update', async () => {
    const res = await fetch(`${baseUrl}/api/v1/enquiries/some-uuid`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.detail, 'No data provided to update');
  });

  test('PATCH /api/v1/enquiries/:id rejects invalid status with HTTP 422', async () => {
    const res = await fetch(`${baseUrl}/api/v1/enquiries/some-uuid`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'INVALID_STATUS' }),
    });

    assert.equal(res.status, 422);
    const body = await res.json();
    assert.ok(body.detail.some((d) => d.loc[1] === 'status'));
  });

  test('PATCH /api/v1/enquiries/:id rejects note longer than 2000 chars with HTTP 422', async () => {
    const res = await fetch(`${baseUrl}/api/v1/enquiries/some-uuid`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ new_note: 'N'.repeat(2001) }),
    });

    assert.equal(res.status, 422);
    const body = await res.json();
    assert.ok(body.detail.some((d) => d.loc[1] === 'new_note'));
  });

  test('PATCH /api/v1/enquiries/:id returns HTTP 404 for non-existent enquiry ID', async () => {
    const res = await fetch(`${baseUrl}/api/v1/enquiries/00000000-0000-0000-0000-000000000000`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });

    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.detail, 'Enquiry not found');
  });

  test('PATCH /api/v1/enquiries/:id rolls back transaction on database error', async () => {
    // Create enquiry
    const createRes = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Rollback Tester',
        mobile_number: '9876543210',
        vehicle_type: 'two-wheeler',
        requirement: 'new-insurance',
      }),
    });
    const created = await createRes.json();

    // Trigger failure inside transaction
    simulateTxError = true;

    const res = await fetch(`${baseUrl}/api/v1/enquiries/${created.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });

    assert.equal(res.status, 500);
    assert.ok(rollbackCalled, 'Expected connection.rollback() to have been called');
  });

  // =========================================================================
  // 5. DELETE ENQUIRY (DELETE /api/v1/enquiries/:id)
  // =========================================================================

  test('DELETE /api/v1/enquiries/:id deletes enquiry returning HTTP 204', async () => {
    // Create enquiry
    const createRes = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Delete Tester',
        mobile_number: '9876543210',
        vehicle_type: 'two-wheeler',
        requirement: 'new-insurance',
      }),
    });
    const created = await createRes.json();

    // Delete
    const delRes = await fetch(`${baseUrl}/api/v1/enquiries/${created.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(delRes.status, 204);

    // Verify deleted with 404
    const getRes = await fetch(`${baseUrl}/api/v1/enquiries/${created.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(getRes.status, 404);
  });

  test('DELETE /api/v1/enquiries/:id returns HTTP 404 for unknown enquiry ID', async () => {
    const res = await fetch(`${baseUrl}/api/v1/enquiries/00000000-0000-0000-0000-000000000000`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.detail, 'Enquiry not found');
  });

  // =========================================================================
  // 6. DATABASE ERROR HANDLING
  // =========================================================================

  test('POST /api/v1/enquiries returns HTTP 500 when database fails', async () => {
    simulateError = true;

    const res = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'DB Error Tester',
        mobile_number: '9876543210',
        vehicle_type: 'two-wheeler',
        requirement: 'new-insurance',
      }),
    });

    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.detail, 'A database error occurred while processing your request');
  });
});
