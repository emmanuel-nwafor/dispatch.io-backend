import type { Request, Response, NextFunction } from 'express';
import { User } from '../models/Users.js';
import { Reel } from '../models/Reels.js';
import { Job } from '../models/Jobs.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const getFeed = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { role } = user;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const limitPerType = Math.ceil(limit / 2);

        let feedItems: any[] = [];

        if (role === 'seeker') {
            // Find jobs
            const query: any = { status: 'open' };
            if (user.profile?.skills && user.profile.skills.length > 0) {
                // Try to match somewhat. Since it's a feed, we want variety, so maybe jobs having at least one skill.
                // In a production app, this would be a complex recommendation algorithm (e.g. ElasticSearch, Redis AI). 
                query.skillsRequired = { $in: user.profile.skills };
            }

            let jobs = await Job.find(query)
                .populate('recruiter', 'recruiterProfile.companyName recruiterProfile.location')
                .skip(skip)
                .limit(limitPerType)
                .lean();

            // If not enough personalized jobs, backfill with others
            if (jobs.length < limitPerType) {
                const extraJobs = await Job.find({ status: 'open', _id: { $nin: jobs.map((j: any) => j._id) } })
                    .populate('recruiter', 'recruiterProfile.companyName recruiterProfile.location')
                    .skip(skip)
                    .limit(limitPerType - jobs.length)
                    .lean();
                jobs = [...jobs, ...extraJobs];
            }

            // Find reels (company_tour, job_preview)
            const reels = await Reel.find({ type: { $in: ['company_tour', 'job_preview'] } })
                .populate('creatorId', 'recruiterProfile.companyName recruiterProfile.location')
                .skip(skip)
                .limit(limitPerType)
                .lean();

            // Format and mix
            const formattedJobs = jobs.map(j => ({ ...j, feedType: 'job' }));
            const formattedReels = reels.map(r => ({ ...r, feedType: 'reel' }));

            feedItems = interleaveArrays(formattedJobs, formattedReels);

        } else if (role === 'recruiter') {
            // Recruiter Feed

            // Find seekers (with completed profiles)
            const seekers = await User.find({ role: 'seeker', isProfileCompleted: true })
                .select('-passwordHash -otpHash') // Make sure to remove sensitive info
                .skip(skip)
                .limit(limitPerType)
                .lean();

            // Find reels (seeker_pitch)
            const reels = await Reel.find({ type: 'seeker_pitch' })
                .populate('creatorId', 'profile.fullName profile.resumeUrl')
                .skip(skip)
                .limit(limitPerType)
                .lean();

            const formattedSeekers = seekers.map(s => ({ ...s, feedType: 'candidate' }));
            const formattedReels = reels.map(r => ({ ...r, feedType: 'reel' }));

            feedItems = interleaveArrays(formattedSeekers, formattedReels);
        } else {
            return res.status(400).json({ message: 'Invalid role for feed' });
        }

        return res.status(200).json({
            success: true,
            page,
            limit,
            count: feedItems.length,
            data: feedItems
        });

    } catch (error: any) {
        console.error('Error fetching feed:', error);
        return res.status(500).json({ message: 'Server error while fetching feed', error: error.message });
    }
};

// Helper function to interleave two arrays evenly
function interleaveArrays(arr1: any[], arr2: any[]): any[] {
    const result = [];
    const maxLength = Math.max(arr1.length, arr2.length);
    for (let i = 0; i < maxLength; i++) {
        if (i < arr1.length) result.push(arr1[i]);
        if (i < arr2.length) result.push(arr2[i]);
    }
    return result;
}
