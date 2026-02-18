import { Schema, model, type Document, type Types } from 'mongoose';

export interface IJob extends Document {
    recruiter: Types.ObjectId;
    title: string;
    companyName: string;
    description: string;
    location: string;
    jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
    salaryRange: {
        min: number;
        max: number;
        currency: string;
    };
    skillsRequired: string[];
    experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Lead';
    applicantsCount: number;
    status: 'open' | 'closed';
}

const jobSchema = new Schema<IJob>({
    recruiter: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },
    companyName: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    jobType: {
        type: String, enum: [
            'Full-time',
            'Part-time',
            'Contract',
            'Remote'
        ], required: true
    },

    salaryRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' }
    },
    skillsRequired: { type: [String], default: [] },
    experienceLevel: { type: String, enum: ['Entry', 'Mid', 'Senior', 'Lead'], required: true },
    applicantsCount: { type: Number, default: 0 },
    status: { type: String, enum: ['open', 'closed'], default: 'open' }
}, { timestamps: true });

export const Job = model<IJob>('Job', jobSchema);