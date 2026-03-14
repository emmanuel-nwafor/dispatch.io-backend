import type { Request, Response, NextFunction } from 'express';
import { User } from '../models/Users.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { AuthService } from '../services/auth.service.js';
import { sendWelcomeEmail } from '../services/email.service.js';

export const completeProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Token is valid but contains no User ID.' });
            return;
        }

        const {
            role,
            fullName,
            phone,
            bio,
            location,
            skills,
            experienceYear,
            education,
            preferredJobTypes,
            companyName,
            companyWebsite,
            industry,
            companySize,
            companyLocation,
            autoApplyEnabled,
            autoApplyMinMatchScore
        } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({ success: false, message: 'User does not exist in the database.' });
            return;
        }

        user.role = role;
        user.isProfileCompleted = true;

        if (role === 'seeker') {
            user.profile = {
                fullName: fullName || '',
                phone: phone || '',
                bio: bio || '',
                location: location || '',
                resumeUrl: user.profile?.resumeUrl || '',
                skills: skills || [],
                experienceYear: Number(experienceYear) || 0,
                education: education || '',
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
            user.profile = undefined;
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

export const getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-passwordHash -__v');

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        next(error);
    }
};