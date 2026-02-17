import { Schema, model, type Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    passwordHash?: string | undefined;
    role?: 'seeker' | 'recruiter' | undefined;
    isVerified: boolean;
    isProfileCompleted: boolean;
    otpHash?: string | undefined;
    otpExpires?: Date | undefined;
    profile?: {
        fullName: string;
        resumeUrl: string;
        skills: string[];
        experienceYear: number;
    } | undefined;
    recruiterProfile?: {
        companyName: string;
        companyWebsite: string;
        accountabilityScore: number;
    } | undefined;
}

const userSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['seeker', 'recruiter'] },

    isVerified: { type: Boolean, default: false },
    isProfileCompleted: { type: Boolean, default: false },
    otpHash: { type: String },
    otpExpires: { type: Date },

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
}, {
    timestamps: true,
    toJSON: {
        transform: (_, ret) => {
            delete ret.passwordHash;
            delete ret.otpHash;
            return ret;
        }
    }
});

// Automaticatically deletes isVerified
userSchema.index({ createdAt: 1 }, {
    expireAfterSeconds: 3600,
    partialFilterExpression: { isVerified: false }
});

export const User = model<IUser>('User', userSchema);