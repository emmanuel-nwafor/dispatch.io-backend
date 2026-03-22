import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { upload } from '../../config/cloudinary.config.js';
import { createReel, deleteReel, getReels, getUploadUrl, likeReel, commentOnReel } from '../../controllers/reels.controller.js';

const router = Router();

router.get('/', protect, getReels);
router.get('/upload-url', protect, getUploadUrl);
router.post('/', protect, upload.single('postImage'), createReel);
router.post('/:id/like', protect, likeReel);
router.post('/:id/comment', protect, commentOnReel);
router.delete('/:id', protect, deleteReel);

export default router;
