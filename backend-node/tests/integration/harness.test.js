import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import mysql from 'mysql2/promise';
import { assertSafeIntegrationEnvironment } from '../../src/config/databaseGuard.js';
import { installEmailSuppression, isEmailSuppressionActive } from '../helpers/emailSuppression.js';
import { createTestEntityTracker } from '../helpers/testTracker.js';

describe('MariaDB Integration Test Harness', () => {
  let emailSuppression;
  let tracker;
  let target;
  let testPool = null;

  before(async () => {
    emailSuppression = installEmailSuppression();
    tracker = createTestEntityTracker();

    const isOptedIn =
      process.env.RUN_DB_INTEGRATION_TESTS === 'true' || process.env.RUN_DB_INTEGRATION_TESTS === '1';

    if (isOptedIn) {
      target = assertSafeIntegrationEnvironment(process.env, {
        isEmailSuppressed: isEmailSuppressionActive(),
      });
      testPool = mysql.createPool({
        uri: process.env.TEST_DATABASE_URL,
        charset: 'utf8mb4',
        timezone: 'Z',
        waitForConnections: true,
        connectionLimit: 5,
      });
    }
  });

  after(async () => {
    if (testPool) {
      // Execute scoped cleanup of any tracked entities before pool closure
      const cleanup = tracker.buildEnquiryCleanupQuery();
      if (cleanup) {
        try {
          await testPool.query(cleanup.sql, cleanup.params);
        } catch {
          // ignore cleanup error during teardown
        }
      }
      await testPool.end();
      testPool = null;
    }
    emailSuppression.restore();
    tracker.clear();
  });

  test('Integration harness enforces active email suppression before execution', () => {
    assert.equal(isEmailSuppressionActive(), true, 'Email suppression must be verified active');
  });

  test('Entity tracker initializes with clean tracking state', () => {
    assert.equal(tracker.getTrackedEnquiries().length, 0);
    assert.equal(tracker.getTrackedAdmins().length, 0);
    assert.equal(tracker.buildEnquiryCleanupQuery(), null);
    assert.equal(tracker.buildAdminCleanupQuery(), null);
  });

  test('Pre-flight guards validate isolated test database target', (t) => {
    if (!testPool) {
      t.skip('Opt-in absent: live database tests skipped.');
      return;
    }
    assert.ok(target.allowed, 'Integration environment must be verified safe');
    assert.equal(target.database, 'dheeksha_insurance_test');
    assert.equal(target.user, 'dheeksha_test_user');
  });

  test('Live connection connects to dheeksha_insurance_test and verifies schema', async (t) => {
    if (!testPool) {
      t.skip('Opt-in absent: live database tests skipped.');
      return;
    }

    const [rows] = await testPool.query('SELECT DATABASE() AS current_db, 1 AS live_test;');
    assert.equal(rows[0].current_db, 'dheeksha_insurance_test');
    assert.equal(rows[0].live_test, 1);

    const [tables] = await testPool.query('SHOW TABLES;');
    const tableNames = tables.map((r) => Object.values(r)[0]).sort();
    assert.deepEqual(tableNames, ['admins', 'alembic_version', 'enquiries', 'enquiry_notes']);
  });

  test('Database isolation enforces zero access to production or unrelated schemas', async (t) => {
    if (!testPool) {
      t.skip('Opt-in absent: live database tests skipped.');
      return;
    }

    // Access to production schema MUST fail
    await assert.rejects(
      () => testPool.query('SELECT * FROM dheeksha_insurance.enquiries LIMIT 1;'),
      (err) => err.code === 'ER_TABLEACCESS_DENIED_ERROR' || err.code === 'ER_DBACCESS_DENIED_ERROR'
    );

    // Access to unrelated bitforum schema MUST fail
    await assert.rejects(
      () => testPool.query('SHOW TABLES FROM bitforum;'),
      (err) => err.code === 'ER_DBACCESS_DENIED_ERROR' || err.code === 'ER_ACCESS_DENIED_ERROR'
    );

    // Access to unrelated foodhunter schema MUST fail
    await assert.rejects(
      () => testPool.query('SHOW TABLES FROM foodhunter;'),
      (err) => err.code === 'ER_DBACCESS_DENIED_ERROR' || err.code === 'ER_ACCESS_DENIED_ERROR'
    );

    // Destructive DDL (DROP TABLE) MUST fail at database permission level
    await assert.rejects(
      () => testPool.query('DROP TABLE enquiries;'),
      (err) => err.code === 'ER_TABLEACCESS_DENIED_ERROR' || err.code === 'ER_DBACCESS_DENIED_ERROR'
    );
  });

  test('Tracks test entity and performs scoped parameterized cleanup', async (t) => {
    if (!testPool) {
      t.skip('Opt-in absent: live database tests skipped.');
      return;
    }

    const testId = crypto.randomUUID();
    tracker.trackEnquiry(testId);
    assert.deepEqual(tracker.getTrackedEnquiries(), [testId]);

    const now = new Date();
    // Insert test enquiry into isolated test database
    await testPool.query(
      `INSERT INTO enquiries (id, full_name, mobile_number, vehicle_type, requirement, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [testId, 'Integration Test User', '9876543210', 'Two Wheeler', 'New Policy', 'new', now, now]
    );

    // Verify insertion
    const [fetched] = await testPool.query('SELECT * FROM enquiries WHERE id = ?;', [testId]);
    assert.equal(fetched.length, 1);
    assert.equal(fetched[0].id, testId);
    assert.equal(fetched[0].full_name, 'Integration Test User');

    // Build and execute scoped cleanup
    const cleanupQuery = tracker.buildEnquiryCleanupQuery();
    assert.ok(cleanupQuery);
    assert.equal(cleanupQuery.sql, 'DELETE FROM enquiries WHERE id IN (?);');
    assert.deepEqual(cleanupQuery.params, [testId]);

    const [deleteResult] = await testPool.query(cleanupQuery.sql, cleanupQuery.params);
    assert.equal(deleteResult.affectedRows, 1);

    // Verify entity no longer exists
    const [afterDelete] = await testPool.query('SELECT * FROM enquiries WHERE id = ?;', [testId]);
    assert.equal(afterDelete.length, 0);

    // Clear tracker
    tracker.clear();
    assert.equal(tracker.getTrackedEnquiries().length, 0);
  });
});

