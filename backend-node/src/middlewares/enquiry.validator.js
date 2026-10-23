/**
 * Enquiry Validation Middleware
 *
 * Implements strict schema validation adhering to FastAPI / Pydantic contract:
 * {"detail":[{"msg":"...","loc":["body"|"query", "field"]}]}
 */

export const VALID_VEHICLE_TYPES = [
  'two-wheeler',
  'private-car',
  'commercial',
  'heavy',
  'other',
];

export const VALID_REQUIREMENTS = [
  'new-insurance',
  'renewal',
  'claim',
  'policy',
  'other',
];

export const VALID_STATUSES = [
  'NEW',
  'CONTACTED',
  'IN_PROGRESS',
  'COMPLETED',
  'INCOMPLETE',
  'CANCELLED',
];

/**
 * Validates enquiry creation payload (POST /api/v1/enquiries).
 */
export function validateCreateEnquiry(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(422).json({
      detail: [{ loc: ['body'], msg: 'Request body must be a valid JSON object', type: 'value_error' }],
    });
  }

  const errors = [];

  // full_name: required string, 2–100 characters (supports Unicode/Tamil)
  if (body.full_name === undefined || body.full_name === null) {
    errors.push({
      loc: ['body', 'full_name'],
      msg: 'Field required',
      type: 'value_error.missing',
    });
  } else if (typeof body.full_name !== 'string') {
    errors.push({
      loc: ['body', 'full_name'],
      msg: 'String should be a string',
      type: 'type_error.string',
    });
  } else {
    const trimmed = body.full_name.trim();
    if (trimmed.length < 2) {
      errors.push({
        loc: ['body', 'full_name'],
        msg: 'String should have at least 2 characters',
        type: 'value_error.any_str.min_length',
      });
    } else if (trimmed.length > 100) {
      errors.push({
        loc: ['body', 'full_name'],
        msg: 'String should have at most 100 characters',
        type: 'value_error.any_str.max_length',
      });
    }
  }

  // mobile_number: required string, exactly 10 digits
  if (body.mobile_number === undefined || body.mobile_number === null) {
    errors.push({
      loc: ['body', 'mobile_number'],
      msg: 'Field required',
      type: 'value_error.missing',
    });
  } else if (typeof body.mobile_number !== 'string' || !/^\d{10}$/.test(body.mobile_number.trim())) {
    errors.push({
      loc: ['body', 'mobile_number'],
      msg: "String should match pattern '^\\d{10}$'",
      type: 'value_error.str.regex',
    });
  }

  // whatsapp_number: optional string, exactly 10 digits or null
  if (body.whatsapp_number !== undefined && body.whatsapp_number !== null) {
    if (typeof body.whatsapp_number !== 'string') {
      errors.push({
        loc: ['body', 'whatsapp_number'],
        msg: 'String should be a string',
        type: 'type_error.string',
      });
    } else {
      const trimmed = body.whatsapp_number.trim();
      if (trimmed !== '' && !/^\d{10}$/.test(trimmed)) {
        errors.push({
          loc: ['body', 'whatsapp_number'],
          msg: "String should match pattern '^\\d{10}$'",
          type: 'value_error.str.regex',
        });
      }
    }
  }

  // vehicle_type: required enum
  if (body.vehicle_type === undefined || body.vehicle_type === null) {
    errors.push({
      loc: ['body', 'vehicle_type'],
      msg: 'Field required',
      type: 'value_error.missing',
    });
  } else if (!VALID_VEHICLE_TYPES.includes(body.vehicle_type)) {
    errors.push({
      loc: ['body', 'vehicle_type'],
      msg: `Input should be one of: ${VALID_VEHICLE_TYPES.join(', ')}`,
      type: 'enum_error',
    });
  }

  // vehicle_registration_number: optional string, max 50 chars
  if (body.vehicle_registration_number !== undefined && body.vehicle_registration_number !== null) {
    if (typeof body.vehicle_registration_number !== 'string') {
      errors.push({
        loc: ['body', 'vehicle_registration_number'],
        msg: 'String should be a string',
        type: 'type_error.string',
      });
    } else if (body.vehicle_registration_number.trim().length > 50) {
      errors.push({
        loc: ['body', 'vehicle_registration_number'],
        msg: 'String should have at most 50 characters',
        type: 'value_error.any_str.max_length',
      });
    }
  }

  // requirement: required enum
  if (body.requirement === undefined || body.requirement === null) {
    errors.push({
      loc: ['body', 'requirement'],
      msg: 'Field required',
      type: 'value_error.missing',
    });
  } else if (!VALID_REQUIREMENTS.includes(body.requirement)) {
    errors.push({
      loc: ['body', 'requirement'],
      msg: `Input should be one of: ${VALID_REQUIREMENTS.join(', ')}`,
      type: 'enum_error',
    });
  }

  // message: optional string, max 1000 characters
  if (body.message !== undefined && body.message !== null) {
    if (typeof body.message !== 'string') {
      errors.push({
        loc: ['body', 'message'],
        msg: 'String should be a string',
        type: 'type_error.string',
      });
    } else if (body.message.length > 1000) {
      errors.push({
        loc: ['body', 'message'],
        msg: 'String should have at most 1000 characters',
        type: 'value_error.any_str.max_length',
      });
    }
  }

  if (errors.length > 0) {
    return res.status(422).json({ detail: errors });
  }

  req.cleanEnquiry = {
    full_name: body.full_name.trim(),
    mobile_number: body.mobile_number.trim(),
    whatsapp_number: body.whatsapp_number && typeof body.whatsapp_number === 'string' && body.whatsapp_number.trim()
      ? body.whatsapp_number.trim()
      : null,
    vehicle_type: body.vehicle_type,
    vehicle_registration_number: body.vehicle_registration_number && typeof body.vehicle_registration_number === 'string' && body.vehicle_registration_number.trim()
      ? body.vehicle_registration_number.trim()
      : null,
    requirement: body.requirement,
    message: body.message && typeof body.message === 'string' && body.message.trim()
      ? body.message.trim()
      : null,
  };

  next();
}

/**
 * Validates enquiry list query parameters (GET /api/v1/enquiries).
 */
export function validateListEnquiries(req, res, next) {
  const { status, sort_by, skip, limit } = req.query;
  const errors = [];

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      errors.push({
        loc: ['query', 'status'],
        msg: `Value is not a valid enumeration member; permitted: ${VALID_STATUSES.join(', ')}`,
        type: 'enum_error',
      });
    }
  }

  if (sort_by !== undefined) {
    if (sort_by !== 'newest' && sort_by !== 'oldest') {
      errors.push({
        loc: ['query', 'sort_by'],
        msg: "String should match pattern '^(newest|oldest)$'",
        type: 'value_error.str.regex',
      });
    }
  }

  let parsedSkip = 0;
  if (skip !== undefined) {
    parsedSkip = Number(skip);
    if (!Number.isInteger(parsedSkip) || parsedSkip < 0) {
      errors.push({
        loc: ['query', 'skip'],
        msg: 'Input should be greater than or equal to 0',
        type: 'value_error.number.not_ge',
      });
    }
  }

  let parsedLimit = 100;
  if (limit !== undefined) {
    parsedLimit = Number(limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      errors.push({
        loc: ['query', 'limit'],
        msg: 'Input should be between 1 and 100',
        type: 'value_error.number.not_in_range',
      });
    }
  }

  if (errors.length > 0) {
    return res.status(422).json({ detail: errors });
  }

  req.cleanQuery = {
    status: status || null,
    search: typeof req.query.search === 'string' && req.query.search.trim() ? req.query.search.trim() : null,
    sort_by: sort_by || 'newest',
    skip: parsedSkip,
    limit: parsedLimit,
  };

  next();
}

/**
 * Validates enquiry update request (PATCH /api/v1/enquiries/:id).
 */
export function validateUpdateEnquiry(req, res, next) {
  const body = req.body || {};
  const hasStatus = 'status' in body && body.status !== undefined && body.status !== null;
  const hasNewNote = 'new_note' in body && body.new_note !== undefined && body.new_note !== null;

  if (!hasStatus && !hasNewNote) {
    return res.status(400).json({
      detail: 'No data provided to update',
    });
  }

  const errors = [];

  if (hasStatus) {
    if (!VALID_STATUSES.includes(body.status)) {
      errors.push({
        loc: ['body', 'status'],
        msg: `Value is not a valid enumeration member; permitted: ${VALID_STATUSES.join(', ')}`,
        type: 'enum_error',
      });
    }
  }

  if (hasNewNote) {
    if (typeof body.new_note !== 'string') {
      errors.push({
        loc: ['body', 'new_note'],
        msg: 'String should be a string',
        type: 'type_error.string',
      });
    } else if (body.new_note.length > 2000) {
      errors.push({
        loc: ['body', 'new_note'],
        msg: 'String should have at most 2000 characters',
        type: 'value_error.any_str.max_length',
      });
    }
  }

  if (errors.length > 0) {
    return res.status(422).json({ detail: errors });
  }

  req.cleanUpdate = {
    status: hasStatus ? body.status : null,
    new_note: hasNewNote && typeof body.new_note === 'string' ? body.new_note.trim() : null,
  };

  next();
}
