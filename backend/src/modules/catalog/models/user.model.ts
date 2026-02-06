import { Schema, model, Document } from 'mongoose';

export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    addressType: 'default' | 'primary' | 'secondary';
    isDefault?: boolean;
}

export interface UserPaymentMethod {
    type: 'card' | 'upi';
    cardBrand?: string;
    last4?: string;
    upiId?: string;
    isDefault?: boolean;
}

export interface UserDocument extends Document {
    firstName?: string;
    lastName?: string;
    email: string;
    password?: string; // Optional for OAuth users
    phoneNumber?: string;
    country?: string;
    gender?: 'male' | 'female' | 'other';
    googleId?: string; // For Google OAuth
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
    role: 'admin' | 'user';
    addresses: Address[];
    paymentMethods: UserPaymentMethod[];
}

const UserSchema = new Schema<UserDocument>(
    {
        firstName: {
            type: String,
            required: false,
            trim: true,
            default: '',
        },

        lastName: {
            type: String,
            required: false,
            trim: true,
            default: '',
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: false, // Optional for OAuth users
        },

        phoneNumber: {
            type: String,
            required: false,
            unique: true,
            sparse: true, // Allows multiple null/empty values
            trim: true,
            match: [/^\+[1-9]\d{7,14}$/, 'Please provide a valid E.164 mobile number (e.g. +919876543210)'],
        },

        country: {
            type: String,
            required: false,
            trim: true,
            default: '',
        },

        gender: {
            type: String,
            enum: ['male', 'female', 'other', ''],
            required: false,
            lowercase: true,
            trim: true,
            default: '',
        },

        googleId: {
            type: String,
            required: false,
            unique: true,
            sparse: true, // Allows unique constraint with null values
        },

        isPhoneVerified: {
            type: Boolean,
            default: false,
        },

        isEmailVerified: {
            type: Boolean,
            default: false,
        },

        role: {
            type: String,
            enum: ['admin', 'user'],
            default: 'user',
        },
        addresses: [
            {
                street: { type: String, trim: true, required: true },
                city: { type: String, trim: true, required: true },
                state: { type: String, trim: true, required: true },
                zipCode: { type: String, trim: true, required: true },
                addressType: {
                    type: String,
                    enum: ['default', 'primary', 'secondary'],
                    required: true
                },
                isDefault: { type: Boolean, default: false }
            }
        ],
        paymentMethods: [
            {
                type: { type: String, enum: ['card', 'upi'], required: true },
                cardBrand: { type: String, trim: true },
                last4: { type: String, trim: true },
                upiId: { type: String, trim: true },
                isDefault: { type: Boolean, default: false }
            }
        ],
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const UserModel = model<UserDocument>('User', UserSchema);
