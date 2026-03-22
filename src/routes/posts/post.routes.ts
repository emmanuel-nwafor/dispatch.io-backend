import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { upload } from '../../config/multer.config.js';
import { 
    createPost, 
    deletePost, 
    getPosts, 
    toggleLikePost, 
    addComment, 
    resharePost 
} from '../../controllers/post.controller.js';

const router = Router();

router.get('/', protect, getPosts);
router.post('/', protect, upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 }
]), createPost);
router.delete('/:id', protect, deletePost);

// Social routes
router.post('/:id/like', protect, toggleLikePost);
router.post('/:id/comment', protect, addComment);
router.post('/:id/reshare', protect, resharePost);

export default router;
