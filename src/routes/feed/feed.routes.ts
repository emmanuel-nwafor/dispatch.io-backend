import { Router } from 'express';
import { getFeed, getFeedItemById, getReels } from '../../controllers/feed.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', protect, getFeed);
router.get('/reels', protect, getReels);
router.get('/:id', protect, getFeedItemById);

export default router;
