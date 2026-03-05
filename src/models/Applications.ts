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
}

const applicationSchema = new Schema<IApplication>({
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    seekerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'reviewed', 'rejected', 'accepted'], default: 'pending' },
    aiMatchScore: { type: Number, default: 0 },
    aiAnalysis: { type: String, default: '' },
    applicationMethod: { type: String, enum: ['manual', 'auto'], default: 'manual' },
    feedbackGiven: { type: Boolean, default: false }
}, { timestamps: true });

export const Application = model<IApplication>('Application', applicationSchema);