import type { Request, Response, NextFunction } from 'express';
import { Post } from '../models/Posts.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }

        const { content } = req.body;
        const images = req.files ? (req.files as any[]).map(f => f.path) : [];

        if (!content && images.length === 0) {
            res.status(400).json({ success: false, message: 'Content or images are required' });
            return;
        }

        const post = await Post.create({
            creatorId: userId,
            content,
            images
        });

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: post
        });
    } catch (error) {
        next(error);
    }
};

export const getPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { userId } = req.query;
        const query = userId ? { creatorId: userId } : {};

        const posts = await Post.find(query)
            .populate('creatorId', 'role avatar coverImage profile.fullName recruiterProfile.companyName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: posts
        });
    } catch (error) {
        next(error);
    }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;

        const post = await Post.findById(id);

        if (!post) {
            res.status(404).json({ success: false, message: 'Post not found' });
            return;
        }

        if (post.creatorId.toString() !== userId) {
            res.status(401).json({ success: false, message: 'Not authorized to delete this post' });
            return;
        }

        await post.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Post deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
