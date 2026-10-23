/**
 * MariaDB Integration Test Safety Guard
 *
 * Enforces strict fail-closed safeguards before any integration test
 * can initialize a connection pool or run queries against a MariaDB database.
 */

export const EXACT_TEST_DATABASE_NAME = 'dheeksha_insurance_test';
export const ALLOWED_LOCAL_HOSTS = Object.freeze(['localhost', '127.0.0.1', '::1', '[::1]']);
export const FORBIDDEN_ADMIN_USERS = Object.freeze([
  'root',
  'admin',
  'administrator',
  'sa',
  'sysadmin',
  'master',
]);
export const FORBIDDEN_SYSTEM_DATABASES = Object.freeze([
  'mysql',
  'information_schema',
  'performance_schema',
  'sys',
  'dheeksha_insurance', // Production database
]);

/**
 * Sanitizes a database connection URL by masking password credentials.
 *
 * @param {string} urlStr
 * @returns {string} Sanitized URL
 */
export function sanitizeDatabaseUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return '[REDACTED]';
  try {
    const isMariadb = urlStr.startsWith('mariadb://');
    const parseable = isMariadb ? urlStr.replace(/^mariadb:\/\//, 'mysql://') : urlStr;
    const parsed = new URL(parseable);
    const user = parsed.username ? parsed.username : '';
    const pass = parsed.password ? '****' : '';
    const auth = user ? (pass ? `${user}:${pass}@` : `${user}@`) : '';
    const protocol = isMariadb ? 'mariadb:' : parsed.protocol;
    return `${protocol}//${auth}${parsed.host}${parsed.pathname}`;
  } catch {
    return '[INVALID_URL_REDACTED]';
  }
}

/**
 * Validates integration test environment configuration.
 * Fails closed on missing, malformed, remote, production, or unprivileged credentials.
 *
 * @param {Object} [env=process.env] - Environment variables object
 * @param {Object} [options={}] - Additional validation options
 * @param {boolean} [options.requireEmailSuppression=true] - Enforce email suppression check
 * @param {boolean} [options.isEmailSuppressed=false] - Flag indicating active email suppression
 * @returns {{ allowed: boolean, reason?: string, message?: string, host?: string, port?: number, database?: string, user?: string, sanitizedUrl?: string }}
 */
export function validateTestDatabaseTarget(env = process.env, options = {}) {
  // 1. Explicit Opt-In Requirement
  const optIn = String(env.RUN_DB_INTEGRATION_TESTS || '').trim().toLowerCase();
  if (optIn !== 'true' && optIn !== '1') {
    return {
      allowed: false,
      reason: 'opt_out',
      message: 'Live database integration tests are disabled. Set RUN_DB_INTEGRATION_TESTS=true to enable.',
    };
  }

  // 2. Explicit Dedicated TEST_DATABASE_URL (Never fall back to DATABASE_URL)
  const testDbUrl = env.TEST_DATABASE_URL ? String(env.TEST_DATABASE_URL).trim() : null;
  if (!testDbUrl) {
    throw new Error(
      'INTEGRATION GUARD ERROR: TEST_DATABASE_URL is not set. Integration tests require an explicit TEST_DATABASE_URL and will never fall back to DATABASE_URL.'
    );
  }

  // 3. Supported Scheme Validation
  const validScheme =
    testDbUrl.startsWith('mysql://') ||
    testDbUrl.startsWith('mysql2://') ||
    testDbUrl.startsWith('mariadb://');

  if (!validScheme) {
    throw new Error(
      'INTEGRATION GUARD ERROR: Invalid TEST_DATABASE_URL scheme. Expected mysql://, mysql2://, or mariadb://.'
    );
  }

  // 4. URL Parsing
  let parsed;
  try {
    const parseable = testDbUrl.startsWith('mariadb://')
      ? testDbUrl.replace(/^mariadb:\/\//, 'mysql://')
      : testDbUrl;
    parsed = new URL(parseable);
  } catch {
    throw new Error('INTEGRATION GUARD ERROR: Malformed TEST_DATABASE_URL.');
  }

  // 5. Hostname Restriction (Local-only)
  const hostname = (parsed.hostname || '').toLowerCase().trim();
  if (!hostname || !ALLOWED_LOCAL_HOSTS.includes(hostname)) {
    throw new Error(
      `INTEGRATION GUARD ERROR: Remote database host "${hostname || 'unknown'}" is rejected. Live integration tests are restricted to local hostnames (localhost, 127.0.0.1, ::1).`
    );
  }

  // 6. Database Name Verification (Exact match: dheeksha_insurance_test)
  const dbName = parsed.pathname.replace(/^\//, '').trim();
  if (!dbName) {
    throw new Error('INTEGRATION GUARD ERROR: Target database name is missing from TEST_DATABASE_URL.');
  }

  if (dbName === 'dheeksha_insurance' || dbName.toLowerCase().includes('prod')) {
    throw new Error(
      `CRITICAL INTEGRATION GUARD ERROR: Execution against production database "${dbName}" is strictly forbidden.`
    );
  }

  if (FORBIDDEN_SYSTEM_DATABASES.includes(dbName.toLowerCase())) {
    throw new Error(
      `INTEGRATION GUARD ERROR: Execution against system or production schema "${dbName}" is forbidden.`
    );
  }

  if (dbName !== EXACT_TEST_DATABASE_NAME) {
    throw new Error(
      `INTEGRATION GUARD ERROR: Integration tests must target database "${EXACT_TEST_DATABASE_NAME}". Found: "${dbName}". Execution refused.`
    );
  }

  // 7. Dedicated Test Account Verification (No root / admin accounts)
  const username = decodeURIComponent(parsed.username || '').toLowerCase().trim();
  if (!username) {
    throw new Error(
      'INTEGRATION GUARD ERROR: TEST_DATABASE_URL must specify a dedicated test username.'
    );
  }

  if (FORBIDDEN_ADMIN_USERS.includes(username)) {
    throw new Error(
      `INTEGRATION GUARD ERROR: Running integration tests as administrative user "${username}" is forbidden. Use a dedicated least-privilege test account.`
    );
  }

  // 8. Email Notification Suppression Guarantee
  const requireSuppression = options.requireEmailSuppression !== false;
  if (requireSuppression && !options.isEmailSuppressed) {
    throw new Error(
      'INTEGRATION GUARD ERROR: Email notification suppression must be active before running integration tests.'
    );
  }

  const port = parsed.port ? parseInt(parsed.port, 10) : 3306;

  return {
    allowed: true,
    host: hostname,
    port,
    database: dbName,
    user: username,
    sanitizedUrl: sanitizeDatabaseUrl(testDbUrl),
  };
}

/**
 * Asserts that the integration environment is safe and returns validated configuration.
 * Throws immediately if any safeguard fails.
 *
 * @param {Object} [env=process.env]
 * @param {Object} [options={}]
 * @returns {Object} Validated test database target metadata
 */
export function assertSafeIntegrationEnvironment(env = process.env, options = {}) {
  const result = validateTestDatabaseTarget(env, options);
  if (!result.allowed) {
    throw new Error(`INTEGRATION GUARD ERROR: ${result.message}`);
  }
  return result;
}
