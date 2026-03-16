import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { Application } from '../models/Applications.js';
import { Job } from '../models/Jobs.js';
import { sendApplicationStatusEmail, sendRecruiterAlert } from '../services/email.service.js';
import { User } from '../models/Users.js';
import { AiService } from '../services/ai.service.js';

/**
 * @desc    Apply to a job
 * @route   POST /api/v1/applications
 * @access  Private (Seeker)
 */
export const applyToJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const { jobId } = req.body;
        const user = authReq.user;

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

        const seeker = await User.findById(seekerId);
        if (!seeker || !seeker.profile) {
            res.status(400).json({ success: false, message: 'Please complete your profile before applying.' });
            return;
        }

        // Perform AI Match Analysis
        const { score, analysis } = await AiService.analyzeMatch(seeker.profile, job);

        const application = await Application.create({
            jobId,
            seekerId,
            status: 'pending',
            aiMatchScore: score,
            aiAnalysis: analysis,
            applicationMethod: req.body.applicationMethod || 'manual'
        });

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully!',
            application
        });

        // Notify recruiter (non-blocking)
        const recruiter = await User.findById(job.recruiter);
        if (recruiter) {
            try {
                await sendRecruiterAlert(recruiter.email, job.title);
            } catch (e) {
                console.error("[Application] Recruiter alert failed:", e);
            }
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
export const getJobApplications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const { jobId } = req.params;
        const recruiterId = authReq.user?.id;

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
export const getMyApplications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const seekerId = authReq.user?.id;

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
export const updateApplicationStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const { id } = req.params;
        const { status } = req.body;
        const recruiterId = authReq.user?.id;

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

        // Notify seeker of status update (non-blocking)
        const seeker = await User.findById(application.seekerId);
        if (seeker) {
            try {
                await sendApplicationStatusEmail(seeker.email, (job as any).title, status);
            } catch (e) {
                console.error("[Application] Status update email failed:", e);
            }
        }
    } catch (error) {
        next(error);
    }
};

export const getPostedJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const recruiterId = authReq.user?.id;

        if (!recruiterId) {
            res.status(401).json({ success: false, message: 'Unauthorized.' });
            return;
        }

        const jobs = await Job.find({ recruiter: recruiterId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: jobs.length,
            jobs
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get AI analysis and refinement suggestions before applying
 * @route   POST /api/v1/applications/analyze
 * @access  Private (Seeker)
 */
export const analyzeMatchBeforeApplying = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const { jobId } = req.body;
        const seekerId = authReq.user?.id;

        const seeker = await User.findById(seekerId);
        if (!seeker || !seeker.profile) {
            res.status(400).json({ success: false, message: 'Profile not found.' });
            return;
        }

        const job = await Job.findById(jobId);
        if (!job) {
            res.status(404).json({ success: false, message: 'Job not found.' });
            return;
        }

        const { score, analysis } = await AiService.analyzeMatch(seeker.profile, job);
        const suggestions = await AiService.getRefinementSuggestions(seeker.profile, job);

        res.status(200).json({
            success: true,
            score,
            analysis,
            suggestions
        });
    } catch (error) {
        next(error);
    }
};
