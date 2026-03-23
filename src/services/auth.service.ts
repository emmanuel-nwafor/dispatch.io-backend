import jwt from 'jsonwebtoken';
import type { IUser } from '../models/Users.js';

export class AuthService {
    static generateToken(user: IUser): string {
        return jwt.sign(
            {
                id: String(user._id),
                role: user.role || 'seeker'
            },
            process.env.JWT_SECRET!,
            { expiresIn: '1d' }
        );
    }

    static formatUserResponse(user: IUser) {
        return {
            id: user._id,
            _id: user._id, // Adding _id for consistency
            email: user.email,
            role: user.role,
            isProfileCompleted: user.isProfileCompleted,
            avatar: user.avatar || '',
            profileImage: user.avatar || '',
            coverImage: user.coverImage || '',
            coverPhoto: user.coverImage || '',
            profile: user.profile,
            recruiterProfile: user.recruiterProfile,
            followers: user.followers || [],
            following: user.following || [],
            details: user.role === 'seeker' ? user.profile : user.recruiterProfile
        };
    }
}