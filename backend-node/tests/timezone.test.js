import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import mysql from 'mysql2/promise';
import app from '../src/app.js';
import { setPool, closePool, initPool, getPool } from '../src/config/database.js';
import { resetConfig, getConfig } from '../src/config/env.js';
import { resetEnquiryRateLimit } from '../src/middlewares/rateLimiter.middleware.js';
import {
  formatDateTime,
  formatEnquiry,
  createEnquiry,
  getEnquiryById,
  updateEnquiry,
  listEnquiries,
} from '../src/services/enquiry.service.js';
import {
  formatSubmissionTime,
  buildEnquiryEmail,
  setTransporter,
} from '../src/services/email.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('MariaDB Timestamp and Timezone Verification', () => {
  let server;
  let baseUrl;
  let mockSentEmails = [];
  let enquiriesStore = [];

  const testSecretKey = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%';

  before(async () => {
    process.env.SECRET_KEY = testSecretKey;
    process.env.NODE_ENV = 'test';
    process.env.PORT = '8000';
    process.env.SMTP_USER = 'business@dheekshainsurance.com';
    process.env.SMTP_PASSWORD = 'mock-password';
    process.env.NOTIFICATION_EMAIL = 'neelkanthbpvi@gmail.com';

    resetConfig();
    getConfig();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    setTransporter(null);
    await closePool();
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    mockSentEmails = [];
    enquiriesStore = [];
    resetEnquiryRateLimit('127.0.0.1');

    setTransporter({
      async sendMail(opts) {
        mockSentEmails.push(opts);
        return { messageId: 'mock-123' };
      },
    });
  });

  // =========================================================================
  // 1. DATABASE POOL CONFIGURATION & MYSQL2 TIMEZONE OPTION
  // =========================================================================

  test('initPool configures timezone: Z for UTC handling in pool options', async () => {
    // Reset pool for inspection
    await closePool();
    const testPool = initPool('mysql://user:pass@localhost:3306/db');
    assert.ok(testPool, 'Pool should be initialized');
    assert.equal(testPool.pool.config.connectionConfig.timezone, 'Z');
    await closePool();
  });

  test('mysql2 formats Date objects to UTC strings when timezone: Z is configured', () => {
    const pool = mysql.createPool({ uri: 'mysql://user:pass@localhost:3306/db', timezone: 'Z' });
    const fixedUtcDate = new Date('2026-10-23T02:30:00.000Z');
    const formatted = pool.format('SELECT ? AS d', [fixedUtcDate]);
    // Must format into UTC date-time '2026-10-23 02:30:00.000' without local timezone offset
    assert.ok(
      formatted.includes("'2026-10-23 02:30:00.000'"),
      `Expected UTC date formatting '2026-10-23 02:30:00.000', got: ${formatted}`
    );
  });

  // =========================================================================
  // 2. formatDateTime UNIT TESTS (PARSING & SERIALIZATION)
  // =========================================================================

  test('formatDateTime serializes Date objects to valid ISO 8601 UTC strings', () => {
    const date = new Date('2026-10-23T04:15:30.123Z');
    const result = formatDateTime(date);
    assert.equal(result, '2026-10-23T04:15:30.123Z');
  });

  test('formatDateTime parses standard MariaDB DATETIME strings as UTC', () => {
    // MariaDB DATETIME without microsecond
    const sqlDateTime = '2026-10-23 04:15:30';
    const result = formatDateTime(sqlDateTime);
    assert.equal(result, '2026-10-23T04:15:30.000Z');
  });

  test('formatDateTime parses MariaDB DATETIME(6) fractional seconds as UTC', () => {
    const sqlDateTimeMicros = '2026-10-23 04:15:30.789123';
    const result = formatDateTime(sqlDateTimeMicros);
    assert.equal(result, '2026-10-23T04:15:30.789Z');
  });

  test('formatDateTime preserves existing ISO 8601 UTC strings without alteration', () => {
    const isoString = '2026-10-23T08:00:00.000Z';
    const result = formatDateTime(isoString);
    assert.equal(result, '2026-10-23T08:00:00.000Z');
  });

  test('formatDateTime handles null, undefined, and empty values gracefully', () => {
    assert.equal(formatDateTime(null), null);
    assert.equal(formatDateTime(undefined), null);
    assert.equal(formatDateTime(''), null);
    assert.equal(formatDateTime('   '), null);
  });

  // =========================================================================
  // 3. AVOIDANCE OF DOUBLE TIMEZONE CONVERSION
  // =========================================================================

  test('formatDateTime avoids double conversion when called on already-formatted output', () => {
    const initialSql = '2026-10-23 11:45:00';
    const firstPass = formatDateTime(initialSql);
    assert.equal(firstPass, '2026-10-23T11:45:00.000Z');

    const secondPass = formatDateTime(firstPass);
    assert.equal(secondPass, '2026-10-23T11:45:00.000Z');

    const thirdPass = formatDateTime(new Date(secondPass));
    assert.equal(thirdPass, '2026-10-23T11:45:00.000Z');
  });

  // =========================================================================
  // 4. formatEnquiry ROW SERIALIZATION INTEGRATION
  // =========================================================================

  test('formatEnquiry converts created_at and updated_at row values to ISO 8601 UTC', () => {
    const mockRow = {
      id: 'uuid-test-1',
      full_name: 'Test Customer',
      mobile_number: '9876543210',
      whatsapp_number: null,
      vehicle_type: 'two-wheeler',
      vehicle_registration_number: null,
      requirement: 'new-insurance',
      message: null,
      status: 'NEW',
      created_at: new Date('2026-10-23T02:00:00.000Z'),
      updated_at: '2026-10-23 03:00:00', // representative SQL string
    };

    const mockNotes = [
      {
        id: 'note-1',
        text: 'Customer requested callback',
        created_at: '2026-10-23 03:30:00.500',
      },
    ];

    const enquiry = formatEnquiry(mockRow, mockNotes);
    assert.equal(enquiry.created_at, '2026-10-23T02:00:00.000Z');
    assert.equal(enquiry.updated_at, '2026-10-23T03:00:00.000Z');
    assert.equal(enquiry.notes.length, 1);
    assert.equal(enquiry.notes[0].created_at, '2026-10-23T03:30:00.500Z');
  });

  // =========================================================================
  // 5. EMAIL TEMPLATE TIMESTAMP HANDLING
  // =========================================================================

  test('formatSubmissionTime produces exact UTC time from Date and MariaDB DATETIME strings', () => {
    // 1. From Date instance
    const d = new Date('2026-10-23T02:30:00.000Z');
    const emailTime1 = formatSubmissionTime(d);
    assert.equal(emailTime1, 'Fri, 23 Oct 2026 02:30:00 GMT');

    // 2. From MariaDB SQL string
    const sqlStr = '2026-10-23 02:30:00';
    const emailTime2 = formatSubmissionTime(sqlStr);
    assert.equal(emailTime2, 'Fri, 23 Oct 2026 02:30:00 GMT');

    // 3. Null / empty fallback
    assert.equal(formatSubmissionTime(null), 'Not available');
  });

  test('buildEnquiryEmail incorporates exact UTC submission timestamp in email body', () => {
    const enquiry = {
      id: 'uuid-time-test',
      full_name: 'Time Check Customer',
      mobile_number: '9876543210',
      vehicle_type: 'private-car',
      requirement: 'renewal',
      created_at: '2026-10-23 15:45:00',
    };

    const email = buildEnquiryEmail(enquiry);
    assert.ok(email.text.includes('Fri, 23 Oct 2026 15:45:00 GMT'));
    assert.ok(email.html.includes('Fri, 23 Oct 2026 15:45:00 GMT'));
  });

  // =========================================================================
  // 6. ENQUIRY API CRUD RESPONSES WITH UTC TIMESTAMPS
  // =========================================================================

  test('POST /api/v1/enquiries returns valid ISO 8601 UTC timestamps', async () => {
    const mockPool = {
      async execute(sql, params) {
        if (sql.includes('INSERT INTO enquiries')) {
          const [
            id, full_name, mobile_number, whatsapp_number,
            vehicle_type, vehicle_registration_number,
            requirement, message, status, created_at, updated_at
          ] = params;

          // Assert the driver is given a valid Date instance for UTC formatting
          assert.ok(created_at instanceof Date);
          assert.ok(updated_at instanceof Date);

          enquiriesStore.push({
            id, full_name, mobile_number, whatsapp_number,
            vehicle_type, vehicle_registration_number,
            requirement, message, status,
            created_at, updated_at,
          });
          return [{ affectedRows: 1 }];
        }
        return [[]];
      },
    };
    setPool(mockPool);

    const res = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'UTC Verified User',
        mobile_number: '9876543210',
        vehicle_type: 'two-wheeler',
        requirement: 'new-insurance',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.created_at.endsWith('Z'), 'created_at must end with UTC Z');
    assert.ok(body.updated_at.endsWith('Z'), 'updated_at must end with UTC Z');
    assert.ok(!isNaN(Date.parse(body.created_at)), 'created_at must parse to valid epoch');
  });

  // =========================================================================
  // 7. TIMEZONE INDEPENDENCE ACROSS PROCESSES (SPAWNED NON-UTC PROCESS TEST)
  // =========================================================================

  test('Isolated child process in non-UTC timezone parses MariaDB timestamps correctly as UTC', async () => {
    const serviceUrl = pathToFileURL(path.resolve(__dirname, '../src/services/enquiry.service.js')).href;
    const emailUrl = pathToFileURL(path.resolve(__dirname, '../src/services/email.service.js')).href;

    const childScript = `
      import assert from 'node:assert/strict';
      import { formatDateTime } from '${serviceUrl}';
      import { formatSubmissionTime } from '${emailUrl}';

      const sqlDateTime = '2026-10-23 02:30:00';
      const formatted = formatDateTime(sqlDateTime);
      assert.equal(formatted, '2026-10-23T02:30:00.000Z', 'formatDateTime must produce UTC ISO regardless of host TZ');

      const emailTime = formatSubmissionTime(sqlDateTime);
      assert.equal(emailTime, 'Fri, 23 Oct 2026 02:30:00 GMT', 'formatSubmissionTime must produce GMT string regardless of host TZ');

      process.exit(0);
    `;

    const child = spawn(process.execPath, ['--input-type=module', '-e', childScript], {
      env: {
        ...process.env,
        TZ: 'America/New_York', // Force US Eastern Time in child
      },
    });

    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    const exitCode = await new Promise((resolve) => {
      child.on('exit', resolve);
    });

    assert.equal(exitCode, 0, `Child process under TZ=America/New_York failed: ${stderr}`);
  });

  test('Isolated child process in Asia/Kolkata timezone parses MariaDB timestamps correctly as UTC', async () => {
    const serviceUrl = pathToFileURL(path.resolve(__dirname, '../src/services/enquiry.service.js')).href;
    const emailUrl = pathToFileURL(path.resolve(__dirname, '../src/services/email.service.js')).href;

    const childScript = `
      import assert from 'node:assert/strict';
      import { formatDateTime } from '${serviceUrl}';
      import { formatSubmissionTime } from '${emailUrl}';

      const sqlDateTime = '2026-10-23 02:30:00';
      const formatted = formatDateTime(sqlDateTime);
      assert.equal(formatted, '2026-10-23T02:30:00.000Z', 'formatDateTime must produce UTC ISO under Asia/Kolkata');

      const emailTime = formatSubmissionTime(sqlDateTime);
      assert.equal(emailTime, 'Fri, 23 Oct 2026 02:30:00 GMT', 'formatSubmissionTime must produce GMT string under Asia/Kolkata');

      process.exit(0);
    `;

    const child = spawn(process.execPath, ['--input-type=module', '-e', childScript], {
      env: {
        ...process.env,
        TZ: 'Asia/Kolkata', // Force Indian Standard Time (+05:30)
      },
    });

    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    const exitCode = await new Promise((resolve) => {
      child.on('exit', resolve);
    });

    assert.equal(exitCode, 0, `Child process under TZ=Asia/Kolkata failed: ${stderr}`);
  });
});
