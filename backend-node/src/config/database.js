import mysql from 'mysql2/promise';

let pool = null;

/**
 * Initializes the MariaDB / MySQL connection pool.
 * Configures utf8mb4 charset and robust connection pool limits.
 * Never logs credentials or connection strings.
 *
 * @param {string} databaseUrl - Connection string (mysql://...)
 * @param {Object} [customOptions={}] - Optional pool overrides
 * @returns {import('mysql2/promise').Pool}
 */
export function initPool(databaseUrl, customOptions = {}) {
  if (pool) {
    return pool;
  }

  if (!databaseUrl || typeof databaseUrl !== 'string') {
    throw new Error('Database initialization failed: Valid connection URL required.');
  }

  const poolOptions = {
    uri: databaseUrl,
    charset: 'utf8mb4',
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '10', 10),
    queueLimit: 0,
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000', 10),
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    ...customOptions,
  };

  pool = mysql.createPool(poolOptions);
  return pool;
}

/**
 * Returns the active database pool instance.
 * @returns {import('mysql2/promise').Pool | null}
 */
export function getPool() {
  return pool;
}

/**
 * Injects a pool or mock pool instance (primarily for tests).
 * @param {import('mysql2/promise').Pool | null} customPool
 */
export function setPool(customPool) {
  pool = customPool;
}

/**
 * Safely closes the database connection pool.
 * Does not crash if the pool was never initialized or was already closed.
 */
export async function closePool() {
  if (!pool) {
    return;
  }

  const currentPool = pool;
  pool = null;

  try {
    await currentPool.end();
  } catch (err) {
    // Avoid leaking credentials; log only safe error identifier
    console.error('Error during database pool shutdown:', err.code || err.name || 'UNKNOWN');
  }
}

/**
 * Health check probe executing SELECT 1.
 * Returns health status without leaking internal database errors.
 *
 * @returns {Promise<{ connected: boolean, message: string }>}
 */
export async function checkDatabaseHealth() {
  if (!pool) {
    return {
      connected: false,
      message: 'Database pool is not initialized.',
    };
  }

  try {
    await pool.query('SELECT 1 AS health_check;');
    return {
      connected: true,
      message: 'Database is reachable.',
    };
  } catch (err) {
    // Log safe error code without leaking connection strings
    console.error('Database connectivity verification failed:', err.code || err.name || 'UNKNOWN');
    return {
      connected: false,
      message: 'Database is unavailable.',
    };
  }
}

/**
 * Helper to execute a query using prepared statements.
 * @param {string} sql
 * @param {Array<any>} [params=[]]
 * @returns {Promise<any>}
 */
export async function query(sql, params = []) {
  if (!pool) {
    throw new Error('Database pool has not been initialized.');
  }
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Executes a callback within a managed database transaction.
 * Acquires a connection, begins transaction, commits on success,
 * rolls back on failure, and ensures connection is released.
 *
 * @template T
 * @param {(connection: import('mysql2/promise').PoolConnection) => Promise<T>} callback
 * @returns {Promise<T>}
 */
export async function withTransaction(callback) {
  if (!pool) {
    throw new Error('Database pool has not been initialized.');
  }

  const connection = typeof pool.getConnection === 'function'
    ? await pool.getConnection()
    : pool;

  try {
    if (typeof connection.beginTransaction === 'function') {
      await connection.beginTransaction();
    }
    const result = await callback(connection);
    if (typeof connection.commit === 'function') {
      await connection.commit();
    }
    return result;
  } catch (err) {
    if (typeof connection.rollback === 'function') {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Error rolling back transaction:', rollbackErr.code || rollbackErr.name || 'UNKNOWN');
      }
    }
    throw err;
  } finally {
    if (typeof connection.release === 'function') {
      connection.release();
    }
  }
}
