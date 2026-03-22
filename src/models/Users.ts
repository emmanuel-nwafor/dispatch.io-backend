import { Schema, model, type Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    username?: string | undefined;
    passwordHash?: string | undefined;
    role?: 'seeker' | 'recruiter' | undefined;
    isVerified: boolean;
    isProfileCompleted: boolean;
    avatar?: string | undefined;
    coverImage?: string | undefined;
    otpHash?: string | undefined;
    otpExpires?: Date | undefined;

    // Expanded Seeker Profile
    profile?: {
        fullName?: string;
        headline?: string;
        phone?: string;
        bio?: string;
        location?: string;
        resumeUrl?: string;
        skills?: string[];
        experience?: Array<{
            id: string;
            title: string;
            company: string;
            startDate: string;
            endDate: string;
            current: boolean;
            description: string;
        }>;
        education?: Array<{
            id: string;
            school: string;
            degree: string;
            field: string;
            startDate: string;
            endDate: string;
        }>;
        languages?: string[];
        birthday?: string;
        gender?: string;
        portfolioUrl?: string;
        linkedInUrl?: string;
        preferredJobTypes?: string[];
        autoApply?: {
            enabled: boolean;
            minMatchScore: number;
        };
    } | undefined;
    // Expanded Recruiter Profile
    recruiterProfile?: {
        companyName: string;
        companyWebsite: string;
        industry: string;
        companySize: string;
        location: string;
        about?: string;
        accountabilityScore: number;
        verifiedCompany: boolean;
    } | undefined;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, unique: true, lowercase: true, trim: true, sparse: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['seeker', 'recruiter'] },

    isVerified: { type: Boolean, default: false },
    isProfileCompleted: { type: Boolean, default: false },
    avatar: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    otpHash: { type: String },
    otpExpires: { type: Date },

    profile: {
        fullName: { type: String, default: '' },
        headline: { type: String, default: '' },
        phone: { type: String, default: '' },
        bio: { type: String, default: '' },
        location: { type: String, default: '' },
        resumeUrl: { type: String, default: '' },
        skills: { type: [String], default: [] },
        experience: { type: [], default: [] },
        education: { type: [], default: [] },
        languages: { type: [String], default: [] },
        birthday: { type: String, default: '' },
        gender: { type: String, default: '' },
        portfolioUrl: { type: String, default: '' },
        linkedInUrl: { type: String, default: '' },
        preferredJobTypes: { type: [String], default: [] },
        autoApply: {
            enabled: { type: Boolean, default: false },
            minMatchScore: { type: Number, default: 85 }
        }
    },
    recruiterProfile: {
        companyName: { type: String, default: '' },
        companyWebsite: { type: String, default: '' },
        industry: { type: String, default: '' },
        companySize: { type: String, default: '' },
        location: { type: String, default: '' },
        about: { type: String, default: '' },
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

userSchema.index({ createdAt: 1 }, {
    expireAfterSeconds: 3600,
    partialFilterExpression: { isVerified: false }
});

export const User = model<IUser>('User', userSchema);