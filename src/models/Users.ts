import { Schema, model, type Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    passwordHash?: string | undefined;
    role?: 'seeker' | 'recruiter' | undefined;
    isVerified: boolean;
    isProfileCompleted: boolean;
    otpHash?: string | undefined;
    otpExpires?: Date | undefined;
    // Expanded Seeker Profile
    profile?: {
        fullName: string;
        phone: string;
        bio: string;
        location: string;
        resumeUrl: string;
        skills: string[];
        experienceYear: number;
        education: string;
        preferredJobTypes: string[];
    } | undefined;
    // Expanded Recruiter Profile
    recruiterProfile?: {
        companyName: string;
        companyWebsite: string;
        industry: string;
        companySize: string;
        location: string;
        accountabilityScore: number;
        verifiedCompany: boolean;
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
        phone: { type: String, default: '' },
        bio: { type: String, default: '' },
        location: { type: String, default: '' },
        resumeUrl: { type: String, default: '' },
        skills: { type: [String], default: [] },
        experienceYear: { type: Number, default: 0 },
        education: { type: String, default: '' },
        preferredJobTypes: { type: [String], default: [] }
    },
    recruiterProfile: {
        companyName: { type: String, default: '' },
        companyWebsite: { type: String, default: '' },
        industry: { type: String, default: '' },
        companySize: { type: String, default: '' },
        location: { type: String, default: '' },
        accountabilityScore: { type: Number, default: 100 },
        verifiedCompany: { type: Boolean, default: false }
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

// Automatically deletes unverified accounts after 1 hour (3600s)
userSchema.index({ createdAt: 1 }, {
    expireAfterSeconds: 3600,
    partialFilterExpression: { isVerified: false }
});

export const User = model<IUser>('User', userSchema);