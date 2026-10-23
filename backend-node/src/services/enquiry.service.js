import crypto from 'node:crypto';
import { getPool, withTransaction } from '../config/database.js';

/**
 * Formats a Date object or date string into an ISO 8601 UTC string.
 *
 * @param {Date | string} date
 * @returns {string | null}
 */
export function formatDateTime(date) {
  if (!date) return null;
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (!trimmed) return null;
    // If string already contains UTC 'Z' or an explicit timezone offset (+HH:MM / -HH:MM)
    if (trimmed.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? trimmed : d.toISOString();
    }
    // If in SQL DATETIME format "YYYY-MM-DD HH:MM:SS[.ffffff]", treat as UTC explicitly
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(trimmed)) {
      const isoCandidate = trimmed.replace(' ', 'T') + 'Z';
      const d = new Date(isoCandidate);
      return isNaN(d.getTime()) ? trimmed : d.toISOString();
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? trimmed : d.toISOString();
  }
  const d = new Date(date);
  return isNaN(d.getTime()) ? String(date) : d.toISOString();
}

/**
 * Formats an enquiry database row and associated notes into the standardized API response structure.
 *
 * @param {Object} enquiry
 * @param {Array<Object>} [notes=[]]
 * @returns {Object}
 */
export function formatEnquiry(enquiry, notes = []) {
  return {
    id: enquiry.id,
    full_name: enquiry.full_name,
    mobile_number: enquiry.mobile_number,
    whatsapp_number: enquiry.whatsapp_number !== undefined && enquiry.whatsapp_number !== null
      ? enquiry.whatsapp_number
      : null,
    vehicle_type: enquiry.vehicle_type,
    vehicle_registration_number: enquiry.vehicle_registration_number !== undefined && enquiry.vehicle_registration_number !== null
      ? enquiry.vehicle_registration_number
      : null,
    requirement: enquiry.requirement,
    message: enquiry.message !== undefined && enquiry.message !== null
      ? enquiry.message
      : null,
    status: enquiry.status,
    notes: (notes || []).map((n) => ({
      id: n.id,
      text: n.text,
      created_at: formatDateTime(n.created_at),
    })),
    created_at: formatDateTime(enquiry.created_at),
    updated_at: formatDateTime(enquiry.updated_at),
  };
}

/**
 * Creates a new customer enquiry in the database with status "NEW".
 *
 * @param {Object} data
 * @returns {Promise<Object>} Created enquiry response
 */
export async function createEnquiry(data) {
  const pool = getPool();
  if (!pool) {
    throw new Error('Database pool has not been initialized.');
  }

  const id = crypto.randomUUID();
  const now = new Date();

  try {
    await pool.execute(
      `INSERT INTO enquiries (
        id, full_name, mobile_number, whatsapp_number,
        vehicle_type, vehicle_registration_number,
        requirement, message, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.full_name,
        data.mobile_number,
        data.whatsapp_number,
        data.vehicle_type,
        data.vehicle_registration_number,
        data.requirement,
        data.message,
        'NEW',
        now,
        now,
      ]
    );

    return {
      id,
      full_name: data.full_name,
      mobile_number: data.mobile_number,
      whatsapp_number: data.whatsapp_number ?? null,
      vehicle_type: data.vehicle_type,
      vehicle_registration_number: data.vehicle_registration_number ?? null,
      requirement: data.requirement,
      message: data.message ?? null,
      status: 'NEW',
      notes: [],
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
  } catch (err) {
    console.error('Database error creating enquiry:', err.code || err.name || 'UNKNOWN');
    const error = new Error('A database error occurred while processing your request');
    error.statusCode = 500;
    throw error;
  }
}

/**
 * Lists enquiries matching optional filters, search queries, and pagination settings.
 * Eagerly fetches associated notes in chronological order to avoid N+1 queries.
 *
 * @param {Object} options
 * @param {string} [options.status]
 * @param {string} [options.search]
 * @param {string} [options.sort_by='newest']
 * @param {number} [options.skip=0]
 * @param {number} [options.limit=100]
 * @returns {Promise<Array<Object>>}
 */
export async function listEnquiries({
  status = null,
  search = null,
  sort_by = 'newest',
  skip = 0,
  limit = 100,
} = {}) {
  const pool = getPool();
  if (!pool) {
    throw new Error('Database pool has not been initialized.');
  }

  let sql = `
    SELECT id, full_name, mobile_number, whatsapp_number,
           vehicle_type, vehicle_registration_number,
           requirement, message, status,
           created_at, updated_at
    FROM enquiries
  `;

  const whereConditions = [];
  const params = [];

  if (status) {
    whereConditions.push('status = ?');
    params.push(status);
  }

  if (search) {
    // Escape LIKE wildcards: %, _, \
    const escapedSearch = search.replace(/([%_\\])/g, '\\$1');
    const pattern = `%${escapedSearch}%`;
    whereConditions.push(
      '(LOWER(full_name) LIKE LOWER(?) OR mobile_number LIKE ? OR whatsapp_number LIKE ? OR LOWER(vehicle_registration_number) LIKE LOWER(?))'
    );
    params.push(pattern, pattern, pattern, pattern);
  }

  if (whereConditions.length > 0) {
    sql += ' WHERE ' + whereConditions.join(' AND ');
  }

  if (sort_by === 'oldest') {
    sql += ' ORDER BY created_at ASC';
  } else {
    sql += ' ORDER BY created_at DESC';
  }

  sql += ` LIMIT ${Number(limit)} OFFSET ${Number(skip)};`;

  try {
    const [rows] = await pool.execute(sql, params);
    if (!rows || rows.length === 0) {
      return [];
    }

    const enquiryIds = rows.map((r) => r.id);

    // Eagerly fetch notes for matching enquiries in chronological order
    const placeholders = enquiryIds.map(() => '?').join(',');
    const [notesRows] = await pool.execute(
      `SELECT id, enquiry_id, text, created_at
       FROM enquiry_notes
       WHERE enquiry_id IN (${placeholders})
       ORDER BY created_at ASC;`,
      enquiryIds
    );

    const notesByEnquiryId = new Map();
    for (const note of notesRows || []) {
      if (!notesByEnquiryId.has(note.enquiry_id)) {
        notesByEnquiryId.set(note.enquiry_id, []);
      }
      notesByEnquiryId.get(note.enquiry_id).push(note);
    }

    return rows.map((row) => formatEnquiry(row, notesByEnquiryId.get(row.id) || []));
  } catch (err) {
    console.error('Database error listing enquiries:', err.code || err.name || 'UNKNOWN');
    const error = new Error('A database error occurred while processing your request');
    error.statusCode = 500;
    throw error;
  }
}

/**
 * Retrieves a single enquiry and its chronological notes by ID.
 *
 * @param {string} id - Enquiry UUID string
 * @returns {Promise<Object | null>}
 */
export async function getEnquiryById(id) {
  if (!id || typeof id !== 'string') {
    return null;
  }

  const pool = getPool();
  if (!pool) {
    throw new Error('Database pool has not been initialized.');
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, full_name, mobile_number, whatsapp_number,
              vehicle_type, vehicle_registration_number,
              requirement, message, status,
              created_at, updated_at
       FROM enquiries
       WHERE id = ?
       LIMIT 1;`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    const [notesRows] = await pool.execute(
      `SELECT id, enquiry_id, text, created_at
       FROM enquiry_notes
       WHERE enquiry_id = ?
       ORDER BY created_at ASC;`,
      [id]
    );

    return formatEnquiry(rows[0], notesRows || []);
  } catch (err) {
    console.error('Database error getting enquiry:', err.code || err.name || 'UNKNOWN');
    const error = new Error('A database error occurred while processing your request');
    error.statusCode = 500;
    throw error;
  }
}

/**
 * Updates an enquiry's status and/or inserts a new note within a managed transaction.
 *
 * @param {string} id - Enquiry UUID string
 * @param {Object} update
 * @param {string | null} [update.status]
 * @param {string | null} [update.new_note]
 * @returns {Promise<Object | null>} Updated enquiry response or null if not found
 */
export async function updateEnquiry(id, { status = null, new_note = null } = {}) {
  if (!id || typeof id !== 'string') {
    return null;
  }

  try {
    return await withTransaction(async (conn) => {
      // Check enquiry exists
      const [rows] = await conn.execute(
        `SELECT id, full_name, mobile_number, whatsapp_number,
                vehicle_type, vehicle_registration_number,
                requirement, message, status,
                created_at, updated_at
         FROM enquiries
         WHERE id = ?
         LIMIT 1;`,
        [id]
      );

      if (!rows || rows.length === 0) {
        return null;
      }

      const now = new Date();

      if (status) {
        await conn.execute(
          `UPDATE enquiries SET status = ?, updated_at = ? WHERE id = ?;`,
          [status, now, id]
        );
      }

      if (new_note) {
        const noteId = crypto.randomUUID();
        await conn.execute(
          `INSERT INTO enquiry_notes (id, enquiry_id, text, created_at)
           VALUES (?, ?, ?, ?);`,
          [noteId, id, new_note, now]
        );

        if (!status) {
          await conn.execute(
            `UPDATE enquiries SET updated_at = ? WHERE id = ?;`,
            [now, id]
          );
        }
      }

      // Fetch updated enquiry record
      const [updatedRows] = await conn.execute(
        `SELECT id, full_name, mobile_number, whatsapp_number,
                vehicle_type, vehicle_registration_number,
                requirement, message, status,
                created_at, updated_at
         FROM enquiries
         WHERE id = ?
         LIMIT 1;`,
        [id]
      );

      // Fetch all notes in chronological order
      const [notesRows] = await conn.execute(
        `SELECT id, enquiry_id, text, created_at
         FROM enquiry_notes
         WHERE enquiry_id = ?
         ORDER BY created_at ASC;`,
        [id]
      );

      return formatEnquiry(updatedRows[0], notesRows || []);
    });
  } catch (err) {
    if (err.statusCode) throw err;
    console.error('Database error updating enquiry:', err.code || err.name || 'UNKNOWN');
    const error = new Error('A database error occurred while updating the enquiry');
    error.statusCode = 500;
    throw error;
  }
}

/**
 * Deletes an enquiry by ID. Associated notes cascade-delete automatically via database foreign key.
 *
 * @param {string} id - Enquiry UUID string
 * @returns {Promise<boolean>} True if deleted, false if enquiry did not exist
 */
export async function deleteEnquiry(id) {
  if (!id || typeof id !== 'string') {
    return false;
  }

  const pool = getPool();
  if (!pool) {
    throw new Error('Database pool has not been initialized.');
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id FROM enquiries WHERE id = ? LIMIT 1;`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return false;
    }

    await pool.execute(
      `DELETE FROM enquiries WHERE id = ?;`,
      [id]
    );

    return true;
  } catch (err) {
    console.error('Database error deleting enquiry:', err.code || err.name || 'UNKNOWN');
    const error = new Error('A database error occurred while deleting the enquiry');
    error.statusCode = 500;
    throw error;
  }
}
