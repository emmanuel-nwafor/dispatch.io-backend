import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { completeProfile, getUserProfile, uploadMedia, updateProfile, deleteUser } from '../../controllers/user.controller.js';
import { upload } from '../../config/cloudinary.config.js';

const router = Router();

router.put('/complete-profile', protect, completeProfile);
router.patch('/profile', protect, updateProfile);
router.delete('/profile', protect, deleteUser);
router.post('/upload', protect, upload.single('file'), uploadMedia);
router.get('/:id', protect, getUserProfile);

export default router;