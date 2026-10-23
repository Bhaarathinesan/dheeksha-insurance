/**
 * Test Entity Tracker and Narrowly Scoped Cleanup Helper
 *
 * Tracks specific UUIDs created during test execution and generates
 * parameterized, narrowly-scoped cleanup queries.
 *
 * STRICT SAFETY RULES:
 * - Prohibits TRUNCATE TABLE
 * - Prohibits DROP DATABASE / DROP TABLE
 * - Prohibits unconditional DELETE without WHERE clause
 * - Operates strictly on recorded test UUIDs
 */

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DANGEROUS_PATTERNS = [
  /\bTRUNCATE\b/i,
  /\bDROP\s+TABLE\b/i,
  /\bDROP\s+DATABASE\b/i,
  /\bALTER\s+TABLE\b/i,
  /\bDELETE\s+FROM\s+\w+\s*;?$/i, // Unconditional DELETE
];

/**
 * Asserts that a SQL query contains no destructive global patterns.
 * @param {string} sql
 */
export function assertSafeQuery(sql) {
  if (!sql || typeof sql !== 'string') {
    throw new Error('SAFETY ERROR: Query must be a non-empty string.');
  }

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sql)) {
      throw new Error(`CRITICAL SAFETY ERROR: Prohibited destructive SQL pattern detected: ${pattern}`);
    }
  }

  if (/^DELETE\s+FROM/i.test(sql.trim()) && !/\bWHERE\b/i.test(sql)) {
    throw new Error('CRITICAL SAFETY ERROR: DELETE statement missing WHERE clause.');
  }
}

/**
 * Creates an isolated tracker instance for recording test-generated entity UUIDs.
 */
export function createTestEntityTracker() {
  const trackedEnquiries = new Set();
  const trackedAdmins = new Set();

  return {
    /**
     * Records a test-generated enquiry ID.
     * @param {string} id
     */
    trackEnquiry(id) {
      if (!id || typeof id !== 'string' || !UUID_V4_REGEX.test(id.trim())) {
        throw new Error(`INVALID ENTITY ID: "${id}". Expected valid UUID v4.`);
      }
      trackedEnquiries.add(id.trim());
    },

    /**
     * Records a test-generated admin ID.
     * @param {string} id
     */
    trackAdmin(id) {
      if (!id || typeof id !== 'string' || !UUID_V4_REGEX.test(id.trim())) {
        throw new Error(`INVALID ENTITY ID: "${id}". Expected valid UUID v4.`);
      }
      trackedAdmins.add(id.trim());
    },

    /**
     * Returns list of recorded enquiry IDs.
     * @returns {string[]}
     */
    getTrackedEnquiries() {
      return Array.from(trackedEnquiries);
    },

    /**
     * Returns list of recorded admin IDs.
     * @returns {string[]}
     */
    getTrackedAdmins() {
      return Array.from(trackedAdmins);
    },

    /**
     * Constructs a scoped parameterized cleanup query for tracked enquiries.
     * Notes automatically cascade delete via MariaDB foreign key constraint.
     * Returns null if no enquiries were tracked.
     *
     * @returns {{ sql: string, params: Array<string> } | null}
     */
    buildEnquiryCleanupQuery() {
      if (trackedEnquiries.size === 0) {
        return null;
      }
      const ids = Array.from(trackedEnquiries);
      const placeholders = ids.map(() => '?').join(',');
      const sql = `DELETE FROM enquiries WHERE id IN (${placeholders});`;
      assertSafeQuery(sql);
      return { sql, params: ids };
    },

    /**
     * Constructs a scoped parameterized cleanup query for tracked admins.
     * Returns null if no admins were tracked.
     *
     * @returns {{ sql: string, params: Array<string> } | null}
     */
    buildAdminCleanupQuery() {
      if (trackedAdmins.size === 0) {
        return null;
      }
      const ids = Array.from(trackedAdmins);
      const placeholders = ids.map(() => '?').join(',');
      const sql = `DELETE FROM admins WHERE id IN (${placeholders});`;
      assertSafeQuery(sql);
      return { sql, params: ids };
    },

    /**
     * Clears tracked ID collections.
     */
    clear() {
      trackedEnquiries.clear();
      trackedAdmins.clear();
    },
  };
}
