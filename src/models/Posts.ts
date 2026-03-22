import { Schema, model, type Document, Types } from 'mongoose';

export interface IPost extends Document {
    creatorId: Types.ObjectId;
    content: string;
    images: string[];
    videoUrl?: string | undefined;
    thumbnailUrl?: string | undefined;
    likes: Types.ObjectId[];
    comments: {
        userId: Types.ObjectId;
        text: string;
        createdAt: Date;
    }[];
}

const postSchema = new Schema<IPost>({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    images: { type: [String], default: [] },
    videoUrl: { type: String },
    thumbnailUrl: { type: String },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

export const Post = model<IPost>('Post', postSchema);
