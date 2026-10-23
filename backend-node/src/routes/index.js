import { Router } from 'express';
import authRoutes from './auth.routes.js';
import enquiryRoutes from './enquiry.routes.js';

const apiRouter = Router();

// Mount auth router under /api/v1/auth
apiRouter.use('/auth', authRoutes);

// Mount enquiry router under /api/v1/enquiries
apiRouter.use('/enquiries', enquiryRoutes);

export default apiRouter;
