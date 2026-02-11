import { Schema, model, type Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    passwordHash: string;
    role: 'seeker' | 'recruiter';
    isProfileCompleted: boolean;
    profile?: {
        fullName: string;
        resumeUrl: string;
        skills: string[];
        experienceYear: number;
    };
    recruiterProfile?: {
        companyName: string;
        companyWebsite: string;
        accountabilityScore: number;
    };
}

const userSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['seeker', 'recruiter'], required: true },
    isProfileCompleted: { type: Boolean, default: false },
    profile: {
        fullName: { type: String, default: '' },
        resumeUrl: { type: String, default: '' },
        skills: { type: [String], default: [] },
        experienceYear: { type: Number, default: 0 }
    },
    recruiterProfile: {
        companyName: { type: String, default: '' },
        companyWebsite: { type: String, default: '' },
        accountabilityScore: { type: Number, default: 100 }
    }
}, { timestamps: true });

export const User = model<IUser>('User', userSchema);