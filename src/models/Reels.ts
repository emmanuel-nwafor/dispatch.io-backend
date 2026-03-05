import { Schema, model, type Document, Types } from 'mongoose';

export interface IReel extends Document {
    creatorId: Types.ObjectId;
    type: 'seeker_pitch' | 'company_tour' | 'job_preview';
    videoUrl: string;
    thumbnailUrl: string;
    title: string;
    description: string;
    tags: string[];
    likes: Types.ObjectId[];
    views: number;
}

const reelSchema = new Schema<IReel>({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['seeker_pitch', 'company_tour', 'job_preview'],
        required: true
    },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    tags: { type: [String], default: [] },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    views: { type: Number, default: 0 }
}, {
    timestamps: true
});

export const Reel = model<IReel>('Reel', reelSchema);
