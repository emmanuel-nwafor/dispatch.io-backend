import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { upload } from '../../config/cloudinary.config.js';
import { createReel, deleteReel } from '../../controllers/reels.controller.js';

const router = Router();

router.post('/', protect, upload.single('postImage'), createReel);
router.delete('/:id', protect, deleteReel);

export default router;
