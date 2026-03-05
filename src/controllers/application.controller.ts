import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { Application } from '../models/Applications.js';
import { Job } from '../models/Jobs.js';
import { sendApplicationStatusEmail, sendRecruiterAlert } from '../services/email.service.js';
import { User } from '../models/Users.js';

/**
 * @desc    Apply to a job
 * @route   POST /api/v1/applications
 * @access  Private (Seeker)
 */
export const applyToJob = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { jobId } = req.body;
        const user = req.user;

        if (!user || user.role !== 'seeker') {
            res.status(403).json({ success: false, message: 'Only job seekers can apply for jobs.' });
            return;
        }

        const seekerId = user.id;

        const job = await Job.findById(jobId);
        if (!job) {
            res.status(404).json({ success: false, message: 'Job not found.' });
            return;
        }

        const existingApplication = await Application.findOne({ jobId: jobId as any, seekerId: seekerId as any });
        if (existingApplication) {
            res.status(400).json({ success: false, message: 'You have already applied for this job.' });
            return;
        }

        const application = await Application.create({
            jobId,
            seekerId,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully!',
            application
        });

        // Notify recruiter
        const recruiter = await User.findById(job.recruiter);
        if (recruiter) {
            await sendRecruiterAlert(recruiter.email, job.title);
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get applications for a specific job
 * @route   GET /api/v1/applications/job/:jobId
 * @access  Private (Recruiter)
 */
export const getJobApplications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { jobId } = req.params;
        const recruiterId = req.user?.id;

        if (!recruiterId) {
            res.status(401).json({ success: false, message: 'Unauthorized.' });
            return;
        }

        const job = await Job.findById(jobId);
        if (!job) {
            res.status(404).json({ success: false, message: 'Job not found.' });
            return;
        }

        if (job.recruiter.toString() !== recruiterId) {
            res.status(403).json({ success: false, message: 'Not authorized to view applications for this job.' });
            return;
        }

        const applications = await Application.find({ jobId: jobId as any })
            .populate('seekerId', 'email profile')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: applications.length,
            applications
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get applications submitted by the current user
 * @route   GET /api/v1/applications/my
 * @access  Private (Seeker)
 */
export const getMyApplications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const seekerId = req.user?.id;

        if (!seekerId) {
            res.status(401).json({ success: false, message: 'Unauthorized.' });
            return;
        }

        const applications = await Application.find({ seekerId: seekerId as any })
            .populate('jobId', 'title companyName location status')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: applications.length,
            applications
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update application status
 * @route   PATCH /api/v1/applications/status/:id
 * @access  Private (Recruiter)
 */
export const updateApplicationStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const recruiterId = req.user?.id;

        if (!recruiterId) {
            res.status(401).json({ success: false, message: 'Unauthorized.' });
            return;
        }

        const application = await Application.findById(id).populate('jobId');
        if (!application) {
            res.status(404).json({ success: false, message: 'Application not found.' });
            return;
        }

        const job: any = application.jobId;

        if (!job || job.recruiter.toString() !== recruiterId) {
            res.status(403).json({ success: false, message: 'Not authorized to update this application.' });
            return;
        }

        application.status = status;
        await application.save();

        res.status(200).json({
            success: true,
            message: 'Application status updated.',
            application
        });

        // Notify seeker of status update
        const seeker = await User.findById(application.seekerId);
        if (seeker) {
            await sendApplicationStatusEmail(seeker.email, (job as any).title, status);
        }
    } catch (error) {
        next(error);
    }
};
