import { Router } from 'express';
import { getFeed } from '../../controllers/feed.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', protect, getFeed);

export default router;
