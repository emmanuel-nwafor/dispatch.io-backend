import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { Job } from '../models/Jobs.js';

export const createJob = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        console.log("Current User in Controller:", req.user);

        const recruiterId = req.user?.id;

        if (!recruiterId) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized. Recruiter ID missing from request context.'
            });
            return;
        }

        const jobData = {
            ...req.body,
            recruiter: recruiterId
        };

        const job = await Job.create(jobData);

        res.status(201).json({
            success: true,
            message: 'Job posted successfully!',
            job
        });
    } catch (error) {
        next(error);
    }
};

export const getAllJobs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const {
            search,
            location,
            jobType,
            experienceLevel,
            page = 1,
            limit = 10
        } = req.query;

        const query: any = { status: 'open' };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        if (jobType) {
            query.jobType = jobType;
        }

        if (experienceLevel) {
            query.experienceLevel = experienceLevel;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const jobs = await Job.find(query)
            .populate('recruiter', 'email profile recruiterProfile')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const totalJobs = await Job.countDocuments(query);

        res.status(200).json({
            success: true,
            count: jobs.length,
            pagination: {
                totalJobs,
                currentPage: Number(page),
                totalPages: Math.ceil(totalJobs / Number(limit))
            },
            jobs
        });
    } catch (error) {
        next(error);
    }
};