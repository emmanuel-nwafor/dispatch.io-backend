import type { Request, Response, NextFunction } from 'express';
import { Reel } from '../models/Reels.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const createReel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }

        const { title, description, type, tags } = req.body;

        if (!req.file) {
            res.status(400).json({ success: false, message: 'Please upload a video/image for the post' });
            return;
        }

        const reel = await Reel.create({
            creatorId: userId,
            title,
            description,
            type: type || 'seeker_pitch',
            videoUrl: req.file.path,
            thumbnailUrl: req.file.path,
            tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : []
        });

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: reel
        });
    } catch (error) {
        next(error);
    }
};

export const deleteReel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }

        const reel = await Reel.findById(id);

        if (!reel) {
            res.status(404).json({ success: false, message: 'Post not found' });
            return;
        }

        if (reel.creatorId.toString() !== userId) {
            res.status(401).json({ success: false, message: 'Not authorized to delete this post' });
            return;
        }

        await reel.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Post deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
