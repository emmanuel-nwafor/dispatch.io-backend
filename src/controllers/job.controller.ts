import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { Job } from '../models/Jobs.js';

export const createJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        console.log("Current User in Controller:", authReq.user);

        const recruiterId = authReq.user?.id;

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

export const getAllJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
            .populate('recruiter', 'email avatar coverImage profile recruiterProfile')
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

export const getJobById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const job = await Job.findById(id).populate('recruiter', 'email avatar coverImage profile recruiterProfile');

        if (!job) {
            res.status(404).json({ success: false, message: 'Job not found' });
            return;
        }

        res.status(200).json({
            success: true,
            job
        });
    } catch (error) {
        next(error);
    }
};

export const updateJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const authReq = req as AuthRequest;
        const recruiterId = authReq.user?.id;

        const job = await Job.findById(id);

        if (!job) {
            res.status(404).json({ success: false, message: 'Job not found' });
            return;
        }

        if (job.recruiter.toString() !== recruiterId) {
            res.status(401).json({ success: false, message: 'Not authorized to update this job' });
            return;
        }

        const updatedJob = await Job.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

        res.status(200).json({
            success: true,
            message: 'Job updated successfully',
            job: updatedJob
        });
    } catch (error) {
        next(error);
    }
};

export const deleteJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const authReq = req as AuthRequest;
        const recruiterId = authReq.user?.id;

        const job = await Job.findById(id);

        if (!job) {
            res.status(404).json({ success: false, message: 'Job not found' });
            return;
        }

        if (job.recruiter.toString() !== recruiterId) {
            res.status(401).json({ success: false, message: 'Not authorized to delete this job' });
            return;
        }

        await job.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Job deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};