import { Schema, model, Document } from 'mongoose';

export interface IOtp extends Document {
    email: string;
    otpHash: string;
    createdAt: Date;
}

const otpSchema = new Schema<IOtp>({
    email: { type: String, required: true, lowercase: true, trim: true },
    otpHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 }
});

export const Otp = model<IOtp>('Otp', otpSchema);