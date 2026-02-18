import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { completeProfile } from '../../controllers/user.controller.js';

const router = Router();

router.put('/complete-profile', protect, completeProfile);

export default router;