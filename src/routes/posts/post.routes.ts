import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { upload } from '../../config/cloudinary.config.js';
import { createPost, deletePost, getPosts } from '../../controllers/post.controller.js';

const router = Router();

router.get('/', protect, getPosts);
router.post('/', protect, upload.array('images', 5), createPost);
router.delete('/:id', protect, deletePost);

export default router;
