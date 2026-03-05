import { Router } from 'express';
import { protect, authorize } from '../../middleware/auth.middleware.js';
import {
    applyToJob,
    getJobApplications,
    getMyApplications,
    updateApplicationStatus
} from '../../controllers/application.controller.js';

const router = Router();

router.post('/', protect, authorize('seeker'), applyToJob);
router.get('/my', protect, authorize('seeker'), getMyApplications);

router.get('/job/:jobId', protect, authorize('recruiter'), getJobApplications);
router.patch('/status/:id', protect, authorize('recruiter'), updateApplicationStatus);

export default router;
