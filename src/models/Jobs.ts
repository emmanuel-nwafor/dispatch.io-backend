import { Schema, model, Types } from 'mongoose';
import type { Document } from 'mongoose';

export interface IJob extends Document {
    recruiterId: Types.ObjectId;
    title: string;
    description: string;
    requirements: string[];
    salaryRange: { min: number; max: number };
    status: 'open' | 'closed';
}

const jobSchema = new Schema<IJob>({
    recruiterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    salaryRange: {
        min: Number,
        max: Number
    },
    status: { type: String, enum: ['open', 'closed'], default: 'open' }
}, { timestamps: true });

export const Job = model<IJob>('Job', jobSchema);