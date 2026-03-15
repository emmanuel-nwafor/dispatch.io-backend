import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { completeProfile, getUserProfile, uploadAvatar } from '../../controllers/user.controller.js';
import { upload } from '../../config/cloudinary.config.js';

const router = Router();

router.put('/complete-profile', protect, completeProfile);
router.post('/upload', protect, upload.single('avatar'), uploadAvatar);
router.get('/:id', protect, getUserProfile);

export default router;