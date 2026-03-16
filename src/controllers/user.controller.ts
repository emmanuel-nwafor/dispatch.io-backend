import type { Request, Response, NextFunction } from 'express';
import { User } from '../models/Users.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { AuthService } from '../services/auth.service.js';
import { sendWelcomeEmail } from '../services/email.service.js';
import { Application } from '../models/Applications.js';

export const completeProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Token is valid but contains no User ID.' });
            return;
        }

        if (!req.body || Object.keys(req.body).length === 0) {
            res.status(400).json({ success: false, message: 'Request body is missing.' });
            return;
        }

        const {
            role,
            fullName,
            headline,
            phone,
            bio,
            location,
            skills,
            experience,
            education,
            languages,
            birthday,
            gender,
            portfolioUrl,
            linkedInUrl,
            preferredJobTypes,
            companyName,
            companyWebsite,
            industry,
            companySize,
            companyLocation,
            autoApplyEnabled,
            autoApplyMinMatchScore,
            avatar,
            coverImage
        } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({ success: false, message: 'User does not exist in the database.' });
            return;
        }

        user.role = role;
        user.isProfileCompleted = true;
        if (avatar) user.avatar = avatar;
        if (coverImage) user.coverImage = coverImage;

        if (role === 'seeker') {
            user.profile = {
                fullName: fullName || '',
                headline: headline || '',
                phone: phone || '',
                bio: bio || '',
                location: location || '',
                resumeUrl: user.profile?.resumeUrl || '',
                skills: skills || [],
                experience: experience || [],
                education: education || [],
                languages: languages || [],
                birthday: birthday || '',
                gender: gender || '',
                portfolioUrl: portfolioUrl || '',
                linkedInUrl: linkedInUrl || '',
                preferredJobTypes: preferredJobTypes || [],
                autoApply: {
                    enabled: autoApplyEnabled ?? user.profile?.autoApply?.enabled ?? false,
                    minMatchScore: autoApplyMinMatchScore ?? user.profile?.autoApply?.minMatchScore ?? 85
                }
            };
            user.recruiterProfile = undefined;
            user.markModified('profile');
        } else if (role === 'recruiter') {
            user.recruiterProfile = {
                companyName: companyName || '',
                companyWebsite: companyWebsite || '',
                industry: industry || '',
                companySize: companySize || '',
                location: companyLocation || location || '',
                accountabilityScore: 100,
                verifiedCompany: false
            };
            user.markModified('recruiterProfile');
        }

        await user.save();

        if (fullName) {
            await sendWelcomeEmail(user.email, fullName);
        }

        res.status(200).json({
            success: true,
            message: 'Profile completed successfully!',
            user: AuthService.formatUserResponse(user)
        });
    } catch (error) {
        next(error);
    }
};

export const uploadMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Not authorized' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ success: false, message: 'Please upload a file' });
            return;
        }

        const imageUrl = req.file.path;
        const { type } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        if (type === 'avatar') {
            user.avatar = imageUrl;
        } else if (type === 'coverImage' || type === 'cover') {
            user.coverImage = imageUrl;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'File uploaded and profile updated successfully',
            imageUrl,
            user: AuthService.formatUserResponse(user)
        });
    } catch (error) {
        next(error);
    }
};

export const getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        let { id } = req.params;

        if (id === 'me') {
            const authReq = req as AuthRequest;
            if (!authReq.user?.id) {
                res.status(401).json({ success: false, message: 'Not authorized to access "me" without valid token.' });
                return;
            }
            id = authReq.user.id;
        }

        const user = await User.findById(id).select('-passwordHash -__v');

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        // Fetch applied jobs count
        const appliedJobsCount = await Application.countDocuments({ seekerId: user._id });

        res.status(200).json({
            success: true,
            user: {
                ...AuthService.formatUserResponse(user),
                appliedJobsCount
            }
        });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Not authorized' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        // Update top level fields
        if (req.body.avatar) user.avatar = req.body.avatar;
        if (req.body.coverImage) user.coverImage = req.body.coverImage;

        // Update role-specific profile
        if (user.role === 'seeker' && user.profile) {
            user.profile = { ...user.profile, ...req.body };
            user.markModified('profile');
        } else if (user.role === 'recruiter' && user.recruiterProfile) {
            user.recruiterProfile = { ...user.recruiterProfile, ...req.body };
            user.markModified('recruiterProfile');
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: AuthService.formatUserResponse(user)
        });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Not authorized' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'User account deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};