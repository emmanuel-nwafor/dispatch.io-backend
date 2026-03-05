import { Router } from 'express';
import { protect, authorize } from '../../middleware/auth.middleware.js';
import {
    applyToJob,
    getJobApplications,
    getMyApplications,
    getPostedJobs,
    updateApplicationStatus,
    analyzeMatchBeforeApplying
} from '../../controllers/application.controller.js';

const router = Router();

// Candidate routes
router.post('/apply', protect, authorize('seeker'), applyToJob);

router.post('/analyze', protect, authorize('seeker'), analyzeMatchBeforeApplying);

router.get('/my', protect, authorize('seeker'), getMyApplications);

router.get('/job/:jobId', protect, authorize('recruiter'), getJobApplications);

router.get('/jobs', protect, authorize('recruiter'), getPostedJobs)

router.patch('/status/:id', protect, authorize('recruiter'), updateApplicationStatus);

export default router;
