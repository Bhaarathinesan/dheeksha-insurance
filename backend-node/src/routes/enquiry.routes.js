import { Router } from 'express';
import {
  createEnquiry,
  listEnquiries,
  getEnquiry,
  updateEnquiry,
  deleteEnquiry,
} from '../controllers/enquiry.controller.js';
import { requireAdminAuth } from '../middlewares/auth.middleware.js';
import { enquiryRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  validateCreateEnquiry,
  validateListEnquiries,
  validateUpdateEnquiry,
} from '../middlewares/enquiry.validator.js';

const router = Router();

// POST /api/v1/enquiries - Public, Rate Limited (5/min), Validated
router.post('/', enquiryRateLimiter, validateCreateEnquiry, createEnquiry);

// GET /api/v1/enquiries - Protected, Admin only, Query validated
router.get('/', requireAdminAuth, validateListEnquiries, listEnquiries);

// GET /api/v1/enquiries/:id - Protected, Admin only
router.get('/:id', requireAdminAuth, getEnquiry);

// PATCH /api/v1/enquiries/:id - Protected, Admin only, Body validated
router.patch('/:id', requireAdminAuth, validateUpdateEnquiry, updateEnquiry);

// DELETE /api/v1/enquiries/:id - Protected, Admin only
router.delete('/:id', requireAdminAuth, deleteEnquiry);

export default router;
