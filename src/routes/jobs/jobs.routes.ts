import { Router } from 'express';
import { protect, authorize } from '../../middleware/auth.middleware.js';
import { createJob, getAllJobs, getJobById, updateJob, deleteJob } from '../../controllers/job.controller.js';

const router = Router();

router.get('/', protect, getAllJobs);
router.get('/:id', protect, getJobById);

router.post('/', protect, authorize('recruiter'), createJob);
router.put('/:id', protect, authorize('recruiter'), updateJob);
router.delete('/:id', protect, authorize('recruiter'), deleteJob);

export default router;