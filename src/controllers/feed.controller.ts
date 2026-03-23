import type { Request, Response, NextFunction } from 'express';
import { User } from '../models/Users.js';
import { Post } from '../models/Posts.js';
import { Job } from '../models/Jobs.js';
import { Reel } from '../models/Reels.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const getFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;

        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const { role } = user;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const limitPerType = Math.ceil(limit / 3);

        let feedItems: any[] = [];

        if (role === 'seeker') {
            // Find jobs
            const query: any = { status: 'open' };
            if (user.profile?.skills && user.profile.skills.length > 0) {
                query.skillsRequired = { $in: user.profile.skills };
            }

            let jobs = await Job.find(query)
                .populate('recruiter', 'recruiterProfile.companyName recruiterProfile.location profile.fullName avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitPerType)
                .lean();

            // Find reels (company_tour, job_preview)
            const reels = await Reel.find({ type: { $in: ['company_tour', 'job_preview'] } })
                .populate('creatorId', 'recruiterProfile.companyName recruiterProfile.location profile.fullName avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitPerType)
                .lean();

            // Find posts
            const posts = await Post.find()
                .populate('creatorId', 'recruiterProfile.companyName recruiterProfile.location profile.fullName avatar')
                .populate({
                    path: 'parentPostId',
                    populate: { path: 'creatorId', select: 'profile.fullName avatar recruiterProfile.companyName' }
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitPerType)
                .lean();

            // Format and mix
            const formattedJobs = jobs.map(j => ({ ...j, feedType: 'job' }));
            const formattedReels = reels.map(r => ({ ...r, feedType: 'reel' }));
            const formattedPosts = posts.map(p => ({ ...p, feedType: 'post' }));

            feedItems = shuffleArray([...formattedJobs, ...formattedReels, ...formattedPosts]);

        } else if (role === 'recruiter') {
            // Recruiter Feed
            const seekers = await User.find({ role: 'seeker', isProfileCompleted: true })
                .select('-passwordHash -otpHash')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitPerType)
                .lean();

            const reels = await Reel.find({ type: 'seeker_pitch' })
                .populate('creatorId', 'profile.fullName recruiterProfile.companyName profile.resumeUrl avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitPerType)
                .lean();

            const posts = await Post.find()
                .populate('creatorId', 'profile.fullName recruiterProfile.companyName profile.location avatar')
                .populate({
                    path: 'parentPostId',
                    populate: { path: 'creatorId', select: 'profile.fullName avatar recruiterProfile.companyName' }
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitPerType)
                .lean();

            const formattedSeekers = seekers.map(s => ({ ...s, feedType: 'candidate' }));
            const formattedReels = reels.map(r => ({ ...r, feedType: 'reel' }));
            const formattedPosts = posts.map(p => ({ ...p, feedType: 'post' }));

            feedItems = shuffleArray([...formattedSeekers, ...formattedReels, ...formattedPosts]);
        }

        res.status(200).json({
            success: true,
            page,
            limit,
            count: feedItems.length,
            data: feedItems
        });
        return;

    } catch (error: any) {
        console.error('Error fetching feed:', error);
        res.status(500).json({ message: 'Server error while fetching feed', error: error.message });
        return;
    }
};

export const getReels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // 1. Fetch Native Reels
        const nativeReels = await Reel.find()
            .populate('creatorId', 'profile.fullName recruiterProfile.companyName avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // 2. Fetch Posts with videos
        const videoPosts = await Post.find({ videoUrl: { $ne: null } })
            .populate('creatorId', 'profile.fullName recruiterProfile.companyName avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Format and merge
        const formattedNative = nativeReels.map(r => ({ ...r, feedType: 'reel' }));
        const formattedPosts = videoPosts.map(p => ({ 
            ...p, 
            feedType: 'post',
            // Map post fields to reel fields if necessary for UI consistency
            title: p.content.substring(0, 50),
            description: p.content
        }));

        // Mix and return (we can improve the mixing logic for personalization later)
        const combined = [...formattedNative, ...formattedPosts].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, limit);

        res.status(200).json({
            success: true,
            page,
            data: combined
        });
        return;
    } catch (error: any) {
        next(error);
        return;
    }
};

function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export const getFeedItemById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { type } = req.query;

        let item: any = null;

        if (type === 'job') {
            item = await Job.findById(id).populate('recruiter', 'recruiterProfile.companyName recruiterProfile.location profile.fullName avatar').lean();
            if (item) item.feedType = 'job';
        } else if (type === 'reel') {
            item = await Reel.findById(id).populate('creatorId', 'recruiterProfile.companyName profile.fullName avatar').lean();
            if (item) {
                item.feedType = 'reel';
            } else {
                // Fallback: check if it's a post with video (often redirected to reels)
                item = await Post.findById(id).populate('creatorId', 'recruiterProfile.companyName profile.fullName avatar').lean();
                if (item) item.feedType = 'post';
            }
        } else if (type === 'post') {
            item = await Post.findById(id).populate('creatorId', 'recruiterProfile.companyName profile.fullName avatar').lean();
            if (item) item.feedType = 'post';
        } else if (type === 'candidate') {
            item = await User.findById(id).select('-passwordHash -otpHash').lean();
            if (item) item.feedType = 'candidate';
        } else {
            // General find logic (already reasonably robust)
            item = await Job.findById(id).populate('recruiter', 'recruiterProfile.companyName recruiterProfile.location profile.fullName avatar').lean();
            if (item) {
                item.feedType = 'job';
            } else {
                item = await Reel.findById(id).populate('creatorId', 'recruiterProfile.companyName profile.fullName avatar').lean();
                if (item) {
                    item.feedType = 'reel';
                } else {
                    item = await Post.findById(id).populate('creatorId', 'recruiterProfile.companyName profile.fullName avatar').lean();
                    if (item) item.feedType = 'post';
                }
            }
        }

        if (!item) {
            res.status(404).json({ message: 'Feed item not found' });
            return;
        }

        res.status(200).json({ success: true, data: item });
        return;
    } catch (error: any) {
        console.error('Error fetching feed item:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
        return;
    }
};
