import type { Request, Response, NextFunction } from 'express';
import { Post } from '../models/Posts.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { Types } from 'mongoose';
import { cloudinary } from '../config/cloudinary.config.js';
import { MuxService } from '../services/mux.service.js';
import { Readable } from 'stream';

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

        // 1. Upload Images to Cloudinary
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

        // 2. Upload Video to Mux if present
        let videoUrl: string | undefined;
        let muxAssetId: string | undefined;
        let muxPlaybackId: string | undefined;
        let thumbnailUrl: string | undefined;

        if (videoFile) {
            // Since Mux needs a URL to pull from, we could either:
            // A. Upload to Cloudinary temporarily (but size limit is the problem)
            // B. Use Mux direct upload (frontend is better for this)
            // For now, to solve the "File size too large" on Cloudinary, 
            // we'll try to use a Mux direct upload process if possible, 
            // but that's complex from the backend with memory buffers.
            
            // BETTER APPROACH: The user said Cloudinary has a 10MB limit. 
            // If the video is LARGE, we definitely need Mux.
            
            // To keep it simple but functional for now:
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
