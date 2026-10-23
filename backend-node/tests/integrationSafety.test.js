import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateTestDatabaseTarget,
  assertSafeIntegrationEnvironment,
  sanitizeDatabaseUrl,
  EXACT_TEST_DATABASE_NAME,
} from '../src/config/databaseGuard.js';
import { getPool } from '../src/config/database.js';
import { createTestEntityTracker, assertSafeQuery } from './helpers/testTracker.js';
import {
  installEmailSuppression,
  isEmailSuppressionActive,
  assertEmailSuppressed,
} from './helpers/emailSuppression.js';

describe('Integration Test Harness and Database Safety Guards', () => {
  const validLocalTestUrl = 'mysql://dheeksha_test_user:secret_test_pass@localhost:3306/dheeksha_insurance_test';
  const validMariadbTestUrl = 'mariadb://dheeksha_test_user:secret_test_pass@127.0.0.1:3306/dheeksha_insurance_test';

  beforeEach(() => {
    // Ensure clean state before each test
  });

  // =========================================================================
  // 1. OPT-IN SAFEGUARDS
  // =========================================================================

  test('1. Missing or false opt-in (RUN_DB_INTEGRATION_TESTS) safely skips live execution', () => {
    const envMissing = {
      TEST_DATABASE_URL: validLocalTestUrl,
    };
    const result1 = validateTestDatabaseTarget(envMissing);
    assert.equal(result1.allowed, false);
    assert.equal(result1.reason, 'opt_out');
    assert.ok(result1.message.includes('RUN_DB_INTEGRATION_TESTS=true'));

    const envFalse = {
      RUN_DB_INTEGRATION_TESTS: 'false',
      TEST_DATABASE_URL: validLocalTestUrl,
    };
    const result2 = validateTestDatabaseTarget(envFalse);
    assert.equal(result2.allowed, false);
    assert.equal(result2.reason, 'opt_out');
  });

  // =========================================================================
  // 2. TEST DATABASE URL SAFEGUARDS
  // =========================================================================

  test('2. Missing TEST_DATABASE_URL rejects execution and does NOT fallback to DATABASE_URL', () => {
    const env = {
      RUN_DB_INTEGRATION_TESTS: 'true',
      DATABASE_URL: 'mysql://root:pass@localhost:3306/dheeksha_insurance', // production URL present
      // TEST_DATABASE_URL omitted
    };

    assert.throws(
      () => validateTestDatabaseTarget(env, { isEmailSuppressed: true }),
      /TEST_DATABASE_URL is not set.*never fall back to DATABASE_URL/i
    );
  });

  // =========================================================================
  // 3. PRODUCTION & UNRELATED DATABASE REJECTION
  // =========================================================================

  test('3. Production database name (dheeksha_insurance) is strictly rejected', () => {
    const env = {
      RUN_DB_INTEGRATION_TESTS: 'true',
      TEST_DATABASE_URL: 'mysql://dheeksha_test_user:pass@localhost:3306/dheeksha_insurance',
    };

    assert.throws(
      () => validateTestDatabaseTarget(env, { isEmailSuppressed: true }),
      /CRITICAL INTEGRATION GUARD ERROR:.*production database/i
    );
  });

  test('4. Any unrelated or system database name is rejected (must be exact: dheeksha_insurance_test)', () => {
    const invalidDbNames = [
      'insurance_db',
      'dheeksha_test',
      'test_db',
      'mysql',
      'information_schema',
      'performance_schema',
      'sys',
      'dheeksha_production',
    ];

    for (const dbName of invalidDbNames) {
      const env = {
        RUN_DB_INTEGRATION_TESTS: 'true',
        TEST_DATABASE_URL: `mysql://dheeksha_test_user:pass@localhost:3306/${dbName}`,
      };

      assert.throws(
        () => validateTestDatabaseTarget(env, { isEmailSuppressed: true }),
        /INTEGRATION GUARD ERROR:/i,
        `Expected rejection for database name: ${dbName}`
      );
    }
  });

  // =========================================================================
  // 5. LOCAL-ONLY HOSTNAME RESTRICTION
  // =========================================================================

  test('5. Remote database hostnames are rejected for local-only testing', () => {
    const remoteHosts = [
      'rds.amazonaws.com',
      '192.168.1.100',
      '10.0.0.5',
      'db.dheekshainsurance.com',
      'google.cloud.internal',
    ];

    for (const host of remoteHosts) {
      const env = {
        RUN_DB_INTEGRATION_TESTS: 'true',
        TEST_DATABASE_URL: `mysql://dheeksha_test_user:pass@${host}:3306/dheeksha_insurance_test`,
      };

      assert.throws(
        () => validateTestDatabaseTarget(env, { isEmailSuppressed: true }),
        /Remote database host.*is rejected/i,
        `Expected rejection for remote host: ${host}`
      );
    }
  });

  test('5b. Permitted local hostnames (localhost, 127.0.0.1, [::1]) are accepted', () => {
    const localHosts = ['localhost', '127.0.0.1', '[::1]'];

    for (const host of localHosts) {
      const env = {
        RUN_DB_INTEGRATION_TESTS: 'true',
        TEST_DATABASE_URL: `mysql://dheeksha_test_user:pass@${host}:3306/dheeksha_insurance_test`,
      };

      const result = validateTestDatabaseTarget(env, { isEmailSuppressed: true });
      assert.equal(result.allowed, true);
      assert.equal(result.database, EXACT_TEST_DATABASE_NAME);
    }
  });

  // =========================================================================
  // 6. SCHEME & PROTOCOL VALIDATION
  // =========================================================================

  test('6. Invalid connection schemes are rejected', () => {
    const invalidSchemes = [
      'postgres://user:pass@localhost:3306/dheeksha_insurance_test',
      'http://localhost:3306/dheeksha_insurance_test',
      'mongodb://user:pass@localhost:27017/dheeksha_insurance_test',
      'sqlite://test.db',
    ];

    for (const invalidUrl of invalidSchemes) {
      const env = {
        RUN_DB_INTEGRATION_TESTS: 'true',
        TEST_DATABASE_URL: invalidUrl,
      };

      assert.throws(
        () => validateTestDatabaseTarget(env, { isEmailSuppressed: true }),
        /Invalid TEST_DATABASE_URL scheme/i
      );
    }
  });

  // =========================================================================
  // 7. PRIVILEGE & USERNAME RESTRICTION
  // =========================================================================

  test('7. Root and administrative database accounts are rejected', () => {
    const adminUsers = ['root', 'admin', 'administrator', 'sa', 'sysadmin', 'master'];

    for (const user of adminUsers) {
      const env = {
        RUN_DB_INTEGRATION_TESTS: 'true',
        TEST_DATABASE_URL: `mysql://${user}:pass@localhost:3306/dheeksha_insurance_test`,
      };

      assert.throws(
        () => validateTestDatabaseTarget(env, { isEmailSuppressed: true }),
        /Running integration tests as administrative user.*is forbidden/i,
        `Expected rejection for admin user: ${user}`
      );
    }
  });

  test('8. Missing test user in connection URL is rejected', () => {
    const env = {
      RUN_DB_INTEGRATION_TESTS: 'true',
      TEST_DATABASE_URL: 'mysql://:pass@localhost:3306/dheeksha_insurance_test',
    };

    assert.throws(
      () => validateTestDatabaseTarget(env, { isEmailSuppressed: true }),
      /TEST_DATABASE_URL must specify a dedicated test username/i
    );
  });

  // =========================================================================
  // 9. EMAIL SUPPRESSION ENFORCEMENT
  // =========================================================================

  test('9. Integration tests fail closed if email suppression is not guaranteed', () => {
    const env = {
      RUN_DB_INTEGRATION_TESTS: 'true',
      TEST_DATABASE_URL: validLocalTestUrl,
    };

    assert.throws(
      () => validateTestDatabaseTarget(env, { isEmailSuppressed: false }),
      /Email notification suppression must be active/i
    );

    // Verify helper actively validates suppression state
    assert.throws(() => assertEmailSuppressed(), /Email suppression is not active/i);

    const suppression = installEmailSuppression();
    try {
      assert.equal(isEmailSuppressionActive(), true);
      assert.doesNotThrow(() => assertEmailSuppressed());
    } finally {
      suppression.restore();
      assert.equal(isEmailSuppressionActive(), false);
    }
  });

  // =========================================================================
  // 10. POOL ISOLATION & FAIL-CLOSED PRE-FLIGHT
  // =========================================================================

  test('10. No database pool is initialized before all guards pass', () => {
    // Current pool state remains uninitialized or null
    assert.equal(getPool(), null, 'Database pool must remain null during guard evaluation');

    const unsafeEnv = {
      RUN_DB_INTEGRATION_TESTS: 'true',
      TEST_DATABASE_URL: 'mysql://root:pass@remote-server:3306/dheeksha_insurance',
    };

    assert.throws(
      () => assertSafeIntegrationEnvironment(unsafeEnv, { isEmailSuppressed: true }),
      /INTEGRATION GUARD ERROR/i
    );

    // Pool remains null
    assert.equal(getPool(), null, 'Database pool must not be initialized on guard failure');
  });

  // =========================================================================
  // 11. CREDENTIAL SANITIZATION IN LOGS & MESSAGES
  // =========================================================================

  test('11. sanitizeDatabaseUrl masks password and secrets in logs', () => {
    const raw = 'mysql://dheeksha_test_user:SuperSecretPassword123!@localhost:3306/dheeksha_insurance_test';
    const sanitized = sanitizeDatabaseUrl(raw);

    assert.ok(!sanitized.includes('SuperSecretPassword123!'), 'Password must be completely redacted');
    assert.ok(sanitized.includes('dheeksha_test_user:****@localhost:3306/dheeksha_insurance_test'));
  });

  test('11b. URL-encoded database passwords parse correctly and are masked', () => {
    const raw = 'mysql://dheeksha_test_user:p%40ss%23%21word@127.0.0.1:3306/dheeksha_insurance_test';
    const env = {
      RUN_DB_INTEGRATION_TESTS: 'true',
      TEST_DATABASE_URL: raw,
    };
    const result = validateTestDatabaseTarget(env, { isEmailSuppressed: true });
    assert.equal(result.allowed, true);
    assert.equal(result.database, EXACT_TEST_DATABASE_NAME);
    assert.equal(result.user, 'dheeksha_test_user');
    assert.ok(!result.sanitizedUrl.includes('p@ss#!word'), 'Decoded password must not leak in sanitizedUrl');
    assert.ok(!result.sanitizedUrl.includes('p%40ss%23%21word'), 'Encoded password must not leak in sanitizedUrl');
    assert.ok(result.sanitizedUrl.includes('dheeksha_test_user:****@127.0.0.1:3306/dheeksha_insurance_test'));
  });

  // =========================================================================
  // 12. TEST CLEANUP TRACKER & DESTRUCTIVE QUERY PROHIBITION
  // =========================================================================

  test('12. Test tracker enforces narrowly-scoped queries and prohibits destructive SQL', () => {
    const tracker = createTestEntityTracker();

    // Empty cleanup lists handled safely
    assert.equal(tracker.buildEnquiryCleanupQuery(), null);
    assert.equal(tracker.buildAdminCleanupQuery(), null);

    // Rejects invalid UUID
    assert.throws(() => tracker.trackEnquiry('invalid-uuid'), /Expected valid UUID v4/i);
    assert.throws(() => tracker.trackAdmin('12345'), /Expected valid UUID v4/i);

    // Tracks valid UUIDs
    const testEnquiryId = '11111111-2222-4333-8444-555555555555';
    const testAdminId = '99999999-8888-4777-8666-555555555555';

    tracker.trackEnquiry(testEnquiryId);
    tracker.trackAdmin(testAdminId);

    assert.deepEqual(tracker.getTrackedEnquiries(), [testEnquiryId]);
    assert.deepEqual(tracker.getTrackedAdmins(), [testAdminId]);

    // Builds safe, parameterized cleanup queries
    const enquiryCleanup = tracker.buildEnquiryCleanupQuery();
    assert.equal(enquiryCleanup.sql, 'DELETE FROM enquiries WHERE id IN (?);');
    assert.deepEqual(enquiryCleanup.params, [testEnquiryId]);

    const adminCleanup = tracker.buildAdminCleanupQuery();
    assert.equal(adminCleanup.sql, 'DELETE FROM admins WHERE id IN (?);');
    assert.deepEqual(adminCleanup.params, [testAdminId]);

    // Prohibits destructive global SQL
    assert.throws(() => assertSafeQuery('TRUNCATE TABLE enquiries;'), /Prohibited destructive SQL/i);
    assert.throws(() => assertSafeQuery('DROP TABLE enquiries;'), /Prohibited destructive SQL/i);
    assert.throws(() => assertSafeQuery('DROP DATABASE dheeksha_insurance_test;'), /Prohibited destructive SQL/i);
    assert.throws(() => assertSafeQuery('DELETE FROM enquiries;'), /Prohibited destructive SQL|missing WHERE clause/i);
    assert.throws(() => assertSafeQuery('DELETE FROM admins'), /Prohibited destructive SQL|missing WHERE clause/i);
  });
});

