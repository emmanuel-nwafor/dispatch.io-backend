import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { completeProfile, getUserProfile, uploadMedia, updateProfile, deleteUser, followUser, unfollowUser, getFollowers, getFollowing, getSuggestions } from '../../controllers/user.controller.js';
import { upload } from '../../config/cloudinary.config.js';

const router = Router();

router.put('/complete-profile', protect, completeProfile);
router.patch('/profile', protect, updateProfile);
router.delete('/profile', protect, deleteUser);
router.post('/upload', protect, upload.single('file'), uploadMedia);
router.get('/:id', protect, getUserProfile);
router.post('/follow/:id', protect, followUser);
router.post('/unfollow/:id', protect, unfollowUser);
router.get('/:id/followers', protect, getFollowers);
router.get('/:id/following', protect, getFollowing);
router.get('/suggestions', protect, getSuggestions);

export default router;