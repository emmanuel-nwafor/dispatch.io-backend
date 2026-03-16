import type { Request, Response, NextFunction } from 'express';
import { Reel } from '../models/Reels.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

import { MuxService } from '../services/mux.service.js';

export const getUploadUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const upload = await MuxService.createDirectUpload();
        res.status(200).json({
            success: true,
            data: {
                uploadUrl: upload.url,
                uploadId: upload.id
            }
        });
    } catch (error) {
        next(error);
    }
};

export const createReel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }

        const { title, description, type, tags, muxAssetId, muxPlaybackId, muxUploadId, videoUrl } = req.body;

        let finalVideoUrl = videoUrl;
        let assetId = muxAssetId;
        let playbackId = muxPlaybackId;

        if (muxUploadId) {
            // Case 1: Direct upload from frontend
            console.log(`Verifying Mux upload: ${muxUploadId}`);
            const asset = await MuxService.getAssetByUploadId(muxUploadId);
            if (asset) {
                assetId = asset.id;
                playbackId = MuxService.getPlaybackId(asset);
            } else {
                res.status(400).json({ success: false, message: 'Video is still processing or upload not found' });
                return;
            }
        } else if (req.file) {
            // Case 2: Uploaded via Cloudinary (fallback)
            finalVideoUrl = req.file.path;
            console.log('Uploading video from Cloudinary to Mux...');
            const asset = await MuxService.uploadVideo(finalVideoUrl);
            assetId = asset.id;
            playbackId = MuxService.getPlaybackId(asset);
        }

        if (!assetId || !playbackId) {
            res.status(400).json({ success: false, message: 'Please upload a video or provide Mux metadata' });
            return;
        }

        const reel = await Reel.create({
            creatorId: userId,
            title,
            description,
            type: type || 'seeker_pitch',
            videoUrl: finalVideoUrl || `https://stream.mux.com/${playbackId}.m3u8`, // Fallback for direct uploads
            assetId,
            playbackId,
            thumbnailUrl: `https://image.mux.com/${playbackId}/thumbnail.jpg`,
            tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : []
        });

        res.status(201).json({
            success: true,
            message: 'Reel created successfully',
            data: reel
        });
    } catch (error) {
        next(error);
    }
};

export const getReels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { userId } = req.query;
        const query = userId ? { creatorId: userId } : {};

        const reels = await Reel.find(query)
            .populate('creatorId', 'role avatar coverImage profile.fullName recruiterProfile.companyName profile.resumeUrl')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: reels
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
