import type { Response, NextFunction } from 'express';
import { User } from '../models/Users.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const completeProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;

        // All users field
        const {
            role,

            // Seeker specific
            fullName,
            phone,
            bio,
            location,
            skills,
            experienceYear,
            education,
            preferredJobTypes,

            // Recruiter specific
            companyName,
            companyWebsite,
            industry,
            companySize,
            companyLocation
        } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        // Lock identity
        user.role = role;
        user.isProfileCompleted = true;

        if (role === 'seeker') {
            user.profile = {
                fullName: fullName || '',
                phone: phone || '',
                bio: bio || '',
                location: location || '',
                resumeUrl: user.profile?.resumeUrl || '', // Keep existing if already uploaded
                skills: skills || [],
                experienceYear: Number(experienceYear) || 0,
                education: education || '',
                preferredJobTypes: preferredJobTypes || []
            };
            //  Recruiter profile is cleared
            user.recruiterProfile = undefined;

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
            // Seeker profile is cleared
            user.profile = undefined;

        } else {
            res.status(400).json({ success: false, message: 'Invalid role selection' });
            return;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile completed successfully!',
            user: user
        });
    } catch (error) {
        next(error);
    }
};