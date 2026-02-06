import { Schema, model, Document, Types } from 'mongoose';

export interface OTPDocument extends Document {
    userId: Types.ObjectId;
    otpHash: string;
    attempts: number;
    type: 'registration' | 'password_reset' | 'login_verification' | 'phone_verification';
    expiresAt: Date;
}

const OTPSchema = new Schema<OTPDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        otpHash: {
            type: String,
            required: true,
        },
        attempts: {
            type: Number,
            default: 0,
        },
        type: {
            type: String,
            enum: ['registration', 'password_reset', 'login_verification', 'phone_verification'],
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: '0s' }, // TTL index
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const OTPModel = model<OTPDocument>('OTP', OTPSchema);
