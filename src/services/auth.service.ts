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
            email: user.email,
            role: user.role,
            isProfileCompleted: user.isProfileCompleted,
            details: user.role === 'seeker' ? user.profile : user.recruiterProfile
        };
    }
}