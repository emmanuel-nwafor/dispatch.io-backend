import type { Request, Response, NextFunction } from 'express';
import { User } from '../models/Users.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { AuthService } from '../services/auth.service.js';
import { sendWelcomeEmail } from '../services/email.service.js';
import { Application } from '../models/Applications.js';
import mongoose from 'mongoose';

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

        console.log('[DEBUG] CompleteProfile Payload:', JSON.stringify(req.body, null, 2));

        const {
            role,
            username,
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
        if (username) user.username = username;
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
                about: bio || '',
                accountabilityScore: 100,
                verifiedCompany: false
            };
            user.markModified('recruiterProfile');
        }

        await user.save();

        if (fullName) {
            try {
                await sendWelcomeEmail(user.email, fullName);
            } catch (emailError) {
                console.error('[ERROR] Failed to send welcome email:', emailError);
            }
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
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            res.status(400).json({ success: false, message: 'Invalid User ID provided.' });
            return;
        }

        let targetId: string = id;

        if (targetId === 'me') {
            const authReq = req as AuthRequest;
            if (!authReq.user?.id) {
                res.status(401).json({ success: false, message: 'Not authorized to access "me" without valid token.' });
                return;
            }
            targetId = authReq.user.id;
        }

        let user;
        if (mongoose.Types.ObjectId.isValid(targetId)) {
            user = await User.findById(targetId).select('-passwordHash -__v');
        } else {
            // Try searching by username (case-insensitive)
            user = await User.findOne({ username: targetId.toLowerCase() } as any).select('-passwordHash -__v');
            
            if (!user) {
                // Fallback: search by fullName or companyName if no user found by username
                user = await User.findOne({
                    $or: [
                        { 'profile.fullName': targetId },
                        { 'recruiterProfile.companyName': targetId }
                    ]
                } as any).select('-passwordHash -__v');
            }
        }

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

        // Update role-specific profile using explicit field whitelists only
        if (user.role === 'seeker' && user.profile) {
            const b = req.body;
            if (b.fullName !== undefined) user.profile.fullName = b.fullName;
            if (b.headline !== undefined) user.profile.headline = b.headline;
            if (b.bio !== undefined) user.profile.bio = b.bio;
            if (b.phone !== undefined) user.profile.phone = b.phone;
            if (b.location !== undefined) user.profile.location = b.location;
            if (b.portfolioUrl !== undefined) user.profile.portfolioUrl = b.portfolioUrl;
            if (b.linkedInUrl !== undefined) user.profile.linkedInUrl = b.linkedInUrl;
            if (b.birthday !== undefined) user.profile.birthday = b.birthday;
            if (b.gender !== undefined) user.profile.gender = b.gender;
            if (b.preferredJobTypes !== undefined) user.profile.preferredJobTypes = b.preferredJobTypes;
            if (Array.isArray(b.skills)) user.profile.skills = b.skills;
            if (Array.isArray(b.experience)) user.profile.experience = b.experience;
            if (Array.isArray(b.education)) user.profile.education = b.education;
            if (Array.isArray(b.languages)) user.profile.languages = b.languages;
            // autoApply is never touched here — managed via completeProfile/settings only
            user.markModified('profile');

        } else if (user.role === 'recruiter' && user.recruiterProfile) {
            const b = req.body;
            if (b.companyName !== undefined) user.recruiterProfile.companyName = b.companyName;
            if (b.fullName !== undefined) user.recruiterProfile.companyName = b.fullName;
            if (b.industry !== undefined) user.recruiterProfile.industry = b.industry;
            if (b.headline !== undefined) user.recruiterProfile.industry = b.headline;
            if (b.about !== undefined) user.recruiterProfile.about = b.about;
            if (b.bio !== undefined) user.recruiterProfile.about = b.bio;
            if (b.location !== undefined) user.recruiterProfile.location = b.location;
            if (b.companyWebsite !== undefined) user.recruiterProfile.companyWebsite = b.companyWebsite;
            if (b.companySize !== undefined) user.recruiterProfile.companySize = b.companySize;
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

export const followUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        const { id: targetId } = req.params;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Not authorized' });
            return;
        }

        if (!targetId || typeof targetId !== 'string') {
            res.status(400).json({ success: false, message: 'Invalid User ID provided.' });
            return;
        }

        if (userId === targetId) {
            res.status(400).json({ success: false, message: 'You cannot follow yourself' });
            return;
        }

        const [user, targetUser] = await Promise.all([
            User.findById(userId),
            User.findById(targetId)
        ]);

        if (!user || !targetUser) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        if (user.following.some(id => id.toString() === targetId)) {
            res.status(400).json({ success: false, message: 'Already following this user' });
            return;
        }

        user.following.push(targetId);
        targetUser.followers.push(userId);

        await Promise.all([user.save(), targetUser.save()]);

        res.status(200).json({ success: true, message: 'Followed successfully' });
    } catch (error) {
        next(error);
    }
};

export const unfollowUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        const { id: targetId } = req.params;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Not authorized' });
            return;
        }

        if (!targetId || typeof targetId !== 'string') {
            res.status(400).json({ success: false, message: 'Invalid User ID provided.' });
            return;
        }

        const [user, targetUser] = await Promise.all([
            User.findById(userId),
            User.findById(targetId)
        ]);

        if (!user || !targetUser) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        user.following = user.following.filter(id => id.toString() !== targetId);
        targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId);

        await Promise.all([user.save(), targetUser.save()]);

        res.status(200).json({ success: true, message: 'Unfollowed successfully' });
    } catch (error) {
        next(error);
    }
};

export const getFollowers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).populate('followers', 'username avatar profile recruiterProfile');
        
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.status(200).json({ success: true, followers: user.followers });
    } catch (error) {
        next(error);
    }
};

export const getFollowing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).populate('following', 'username avatar profile recruiterProfile');
        
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.status(200).json({ success: true, following: user.following });
    } catch (error) {
        next(error);
    }
};