import type { Request, Response, NextFunction } from 'express';
import { Post } from '../models/Posts.js';
import { User } from '../models/Users.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { Types } from 'mongoose';
import { cloudinary } from '../config/cloudinary.config.js';
import { MuxService } from '../services/mux.service.js';
import { Readable } from 'stream';

// Helper to parse mentions and update post
const parseMentions = async (text: string, post: any) => {
    const mentions = text.match(/@(\w+)/g);
    if (mentions) {
        for (const mention of mentions) {
            const username = mention.substring(1).toLowerCase();
            const mentionedUser = await User.findOne({ username });
            if (mentionedUser && !post.mentions.includes(mentionedUser._id)) {
                post.mentions.push(mentionedUser._id);
            }
        }
    }
};

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

        const imageFiles = files?.images || [];
        const videoFile = files?.video?.[0];

        // Upload Images to Cloudinary
        const images = await Promise.all(
            imageFiles.map(async (file) => {
                return new Promise<string>((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: 'dispatch_io_posts' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result!.secure_url);
                        }
                    );
                    Readable.from(file.buffer).pipe(uploadStream);
                });
            })
        );

        // Upload Video to Mux if present
        let videoUrl: string | undefined;
        let muxAssetId: string | undefined;
        let muxPlaybackId: string | undefined;
        let thumbnailUrl: string | undefined;

        if (videoFile) {
            // Let's create a Mux direct upload and PUSH the buffer to it.
            const muxUpload = await MuxService.createDirectUpload();

            // Push the buffer to Mux
            const response = await fetch(muxUpload.url, {
                method: 'PUT',
                body: videoFile.buffer,
                headers: { 'Content-Type': videoFile.mimetype }
            });

            if (!response.ok) throw new Error('Failed to push video to Mux');

            muxAssetId = muxUpload.asset_id!;

            // Poll Mux for playback ID (optional but helpful for immediate UI)
            try {
                let asset = await MuxService.getAssetByUploadId(muxUpload.id);
                // Give it a small delay to process if playback ID is missing
                if (!asset?.playback_ids?.[0]) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    asset = await MuxService.getAssetByUploadId(muxUpload.id);
                }
                muxPlaybackId = asset?.playback_ids?.[0]?.id;
            } catch (e) {
                console.warn('Could not get Mux playback ID immediately:', e);
            }

            videoUrl = muxPlaybackId ? `https://stream.mux.com/${muxPlaybackId}.m3u8` : `https://stream.mux.com/${muxAssetId}.m3u8`;
        }

        if (!content && images.length === 0 && !videoUrl) {
            res.status(400).json({ success: false, message: 'Content, images, or video are required' });
            return;
        }

        const post = await Post.create({
            creatorId: new Types.ObjectId(userId),
            content: content || '',
            images,
            videoUrl,
            muxAssetId,
            muxPlaybackId, // Will be updated by webhook later typically, or we can poll
            thumbnailUrl: req.body.thumbnailUrl
        });

        // Parse mentions in post content
        if (content) {
            await parseMentions(content, post);
            await post.save();
        }

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
            .populate('creatorId', 'role avatar coverImage profile.fullName recruiterProfile.companyName username')
            .populate({
                path: 'parentPostId',
                populate: { path: 'creatorId', select: 'profile.fullName avatar recruiterProfile.companyName' }
            })
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
        return;
    } catch (error) {
        next(error);
    }
};

export const toggleLikePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }

        const post = await Post.findById(id);
        if (!post) {
            res.status(404).json({ success: false, message: 'Post not found' });
            return;
        }

        const userObjectId = new Types.ObjectId(userId);
        const index = post.likes.indexOf(userObjectId);

        if (index === -1) {
            post.likes.push(userObjectId);
        } else {
            post.likes.splice(index, 1);
        }

        await post.save();

        res.status(200).json({
            success: true,
            message: index === -1 ? 'Post liked' : 'Post unliked',
            likesCount: post.likes.length,
            isLiked: index === -1
        });
        return;
    } catch (error) {
        next(error);
    }
};

export const addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }

        if (!text) {
            res.status(400).json({ success: false, message: 'Comment text is required' });
            return;
        }

        const post = await Post.findById(id);
        if (!post) {
            res.status(404).json({ success: false, message: 'Post not found' });
            return;
        }

        const comment = {
            userId: new Types.ObjectId(userId),
            text,
            createdAt: new Date()
        };

        post.comments.push(comment);

        // Parse mentions in the comment text
        await parseMentions(text, post);

        await post.save();

        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            comment
        });
        return;
    } catch (error) {
        next(error);
    }
};

export const resharePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }

        const originalPost = await Post.findById(id);
        if (!originalPost) {
            res.status(404).json({ success: false, message: 'Original post not found' });
            return;
        }

        const reshare = await Post.create({
            creatorId: new Types.ObjectId(userId),
            content: content || '',
            parentPostId: originalPost._id,
            isReshare: true
        });

        // Parse mentions in reshare content
        if (content) {
            await parseMentions(content, reshare);
            await reshare.save();
        }

        res.status(201).json({
            success: true,
            message: 'Post reshared successfully',
            data: reshare
        });
        return;
    } catch (error) {
        next(error);
    }
};
