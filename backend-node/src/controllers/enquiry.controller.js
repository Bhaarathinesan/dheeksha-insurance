import * as enquiryService from '../services/enquiry.service.js';
import { dispatchEnquiryNotification } from '../services/email.service.js';

/**
 * Handles public customer enquiry creation.
 * POST /api/v1/enquiries
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function createEnquiry(req, res, next) {
  try {
    const enquiry = await enquiryService.createEnquiry(req.cleanEnquiry);

    // Non-blocking background email dispatch to business owner
    dispatchEnquiryNotification(enquiry);

    return res.status(201).json(enquiry);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles administrator listing of customer enquiries with filtering, search, and pagination.
 * GET /api/v1/enquiries
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function listEnquiries(req, res, next) {
  try {
    const enquiries = await enquiryService.listEnquiries(req.cleanQuery);
    return res.status(200).json(enquiries);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles administrator retrieval of a single enquiry by UUID.
 * GET /api/v1/enquiries/:id
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function getEnquiry(req, res, next) {
  try {
    const enquiry = await enquiryService.getEnquiryById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({
        detail: 'Enquiry not found',
      });
    }
    return res.status(200).json(enquiry);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles administrator status transition and note appending for an enquiry.
 * PATCH /api/v1/enquiries/:id
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function updateEnquiry(req, res, next) {
  try {
    const updated = await enquiryService.updateEnquiry(req.params.id, req.cleanUpdate);
    if (!updated) {
      return res.status(404).json({
        detail: 'Enquiry not found',
      });
    }
    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles administrator deletion of an enquiry by ID.
 * DELETE /api/v1/enquiries/:id
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function deleteEnquiry(req, res, next) {
  try {
    const deleted = await enquiryService.deleteEnquiry(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        detail: 'Enquiry not found',
      });
    }
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}
