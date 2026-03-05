import { Router } from 'express';
import { protect, authorize } from '../../middleware/auth.middleware.js';
import { createJob, getAllJobs } from '../../controllers/job.controller.js';

const router = Router();

router.get('/', protect, getAllJobs);

router.post('/', protect, authorize('recruiter'), createJob);

export default router;