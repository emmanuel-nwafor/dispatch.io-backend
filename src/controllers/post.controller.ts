import type { Request, Response, NextFunction } from 'express';
import { Post } from '../models/Posts.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { Types } from 'mongoose';

export const createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }

        const content = req.body.content as string | undefined;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

        const images = files?.images ? files.images.map(f => f.path) : [];
        const videoUrl = files?.video?.[0]?.path;
        const thumbnailUrl = (req.body.thumbnailUrl as string | undefined) || (videoUrl ? videoUrl.replace(/\.[^.]+$/, '.jpg') : undefined);

        if (!content && images.length === 0 && !videoUrl) {
            res.status(400).json({ success: false, message: 'Content, images, or video are required' });
            return;
        }

        const post = await Post.create({
            creatorId: new Types.ObjectId(userId),
            content: content || '',
            images,
            videoUrl,
            thumbnailUrl
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
