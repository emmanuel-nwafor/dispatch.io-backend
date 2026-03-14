import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { completeProfile, getUserProfile } from '../../controllers/user.controller.js';

const router = Router();

router.put('/complete-profile', protect, completeProfile);
router.get('/:id', protect, getUserProfile);

export default router;