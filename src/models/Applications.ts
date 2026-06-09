import { Schema, model, Types } from 'mongoose';
import type { Document } from 'mongoose';

export interface IApplication extends Document {
    jobId: Types.ObjectId;
    seekerId: Types.ObjectId;
    status: 'pending' | 'reviewed' | 'rejected' | 'accepted';
    aiMatchScore: number;
    aiAnalysis: string;
    applicationMethod: 'manual' | 'auto';
    feedbackGiven: boolean;
    fullName?: string;
    phone?: string;
    resumeUrl?: string;
    coverLetter?: string;
}

const applicationSchema = new Schema<IApplication>({
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    seekerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'reviewed', 'rejected', 'accepted'], default: 'pending' },
    aiMatchScore: { type: Number, default: 0 },
    aiAnalysis: { type: String, default: '' },
    applicationMethod: { type: String, enum: ['manual', 'auto'], default: 'manual' },
    feedbackGiven: { type: Boolean, default: false },
    fullName: { type: String, default: '' },
    phone: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    coverLetter: { type: String, default: '' }
}, { timestamps: true });

export const Application = model<IApplication>('Application', applicationSchema);