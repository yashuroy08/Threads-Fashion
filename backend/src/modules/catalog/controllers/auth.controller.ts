import { Request, Response } from 'express';
import { asyncHandler } from '../../../common/utils/async-handler';
import { registerUser, loginUser, getUserProfile } from '../services/auth.service';
import { AppError } from '../../../common/errors/app-error';

import { signToken } from '../../../common/utils/jwt';
import { OTPService } from '../services/otp.service';
import { UserModel } from '../models/user.model';
import { OTPModel } from '../models/otp.model';
import { hashPassword, comparePassword } from '../../../common/utils/password';
import { validate } from '../../../common/utils/validators';
import crypto from 'crypto';

export const registerHandler = asyncHandler(
    async (req: Request, res: Response) => {
        try {
            const { email, password, firstName, lastName, phoneNumber, country, gender } = req.body;
            const ip = req.ip || 'unknown';

            // 1. Validate required fields (email + password only)
            if (!email || !validate.email(email)) {
                throw new AppError('Invalid email address format', 400);
            }

            if (!password || password.length < 8) {
                throw new AppError('Password must be at least 8 characters long', 400);
            }

            // 2. Uniqueness check
            const normalizedEmail = email.trim().toLowerCase();
            const existingUser = await UserModel.findOne({ email: normalizedEmail });
            if (existingUser) {
                throw new AppError('Email already registered', 409);
            }

            // 3. Throttling
            await OTPService.checkThrottling(ip);

            // 4. Validate optional phone number if provided
            if (phoneNumber && !validate.phoneNumber(phoneNumber)) {
                throw new AppError('Invalid phone number format. Use E.164 format (e.g., +919876543210)', 400);
            }

            // 5. Create user with minimal info (email + password)
            // Optional fields: firstName, lastName, phoneNumber, country, gender
            const { user } = await registerUser(
                email,
                password,
                firstName,
                lastName,
                gender,
                country,
                phoneNumber
            );

            // 6. Generate and Send Email OTP (MANDATORY FLOW)
            const otp = await OTPService.generateOTP(user._id.toString(), 'registration');

            // ALWAYS Log OTP in development for testing
            if (process.env.NODE_ENV === 'development') {
                console.log('\n========== DEV OTP ==========');
                console.log(`OTP for ${email}: ${otp}`);
                console.log('=============================\n');
            }

            // Send OTP to email only (no phone required)
            const sent = await OTPService.sendDualOTP(phoneNumber || '', email, otp);

            if (!sent) {
                // In development, log OTP to console if sending fails
                if (process.env.NODE_ENV === 'development') {
                    console.warn('\n========== OTP DELIVERY FAILED ==========');
                    console.warn('Email delivery failed. Using console fallback.');
                    console.warn('OTP for user', email, ':', otp);
                    console.warn('User ID:', user._id);
                    console.warn('=========================================\n');
                    // Don't delete user in development - allow console OTP
                } else {
                    // In production, delete the user if OTP sending fails
                    await UserModel.findByIdAndDelete(user._id);
                    await OTPModel.deleteMany({ userId: user._id });
                    throw new AppError('Failed to send verification code. Please try again.', 500);
                }
            }

            res.status(201).json({
                message: 'Verification code sent to your email. Please verify to activate.',
                userId: user._id,
                debugOtp: process.env.NODE_ENV === 'development' ? otp : undefined
            });
        } catch (error: any) {
            console.error('[REGISTRATION ERROR]:', error.message);
            console.error('[REGISTRATION STACK]:', error.stack);
            throw error;
        }
    }
);

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Validate email format
    if (!email || !validate.email(email)) {
        throw new AppError('Invalid email address format', 400);
    }

    if (!password) {
        throw new AppError('Password is required', 400);
    }

    const { user, token } = await loginUser(email, password);

    // Enforce verification blockage
    if (!user.isPhoneVerified && !user.isEmailVerified) {
        return res.status(200).json({
            needsVerification: true,
            userId: user._id,
            message: 'Your account is not verified. Please check your phone/email for the code.'
        });
    }

    res.status(200).json({ token, user });
});

export const verifyOTPHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const { userId, otp, type } = req.body;
        if (!userId || !otp || !type) {
            throw new AppError('Missing required fields', 400);
        }

        const isPasswordReset = type === 'password_reset';
        await OTPService.verifyOTP(userId, otp, type as any, isPasswordReset);

        if (type === 'registration') {
            await UserModel.findByIdAndUpdate(userId, { isEmailVerified: true });
        }

        res.status(200).json({ message: 'Verification successful' });
    }
);

export const resendOTPHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const { userId, type } = req.body;
        const ip = req.ip || 'unknown';

        const user = await UserModel.findById(userId);
        if (!user) throw new AppError('User not found', 404);

        await OTPService.checkThrottling(ip);

        const otp = await OTPService.generateOTP(user._id.toString(), type);

        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEV OTP RESEND] OTP for ${user.email}: ${otp}`);
        }

        const sent = await OTPService.sendDualOTP(user.phoneNumber, user.email, otp);

        // Log OTP in development if sending fails
        if (!sent && process.env.NODE_ENV === 'development') {
            console.warn('\n========== OTP RESEND (Console Fallback) ==========');
            console.warn('OTP for', user.email, ':', otp);
            console.warn('===================================================\n');
        }

        res.status(200).json({
            message: 'Code resent to your email and phone'
        });
    }
);

export const forgotPasswordHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const { email } = req.body;
        const ip = req.ip || 'unknown';

        if (!email) throw new AppError('Email is required', 400);

        // Validate email format
        if (!validate.email(email)) {
            throw new AppError('Invalid email address format', 400);
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await UserModel.findOne({ email: normalizedEmail });

        if (!user) {
            // User requested to show "no mail found" error instead of generic response
            throw new AppError('No account found with this email address', 404);
        }

        await OTPService.checkThrottling(ip);
        const otp = await OTPService.generateOTP(user._id.toString(), 'password_reset');

        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEV OTP RESET] OTP for ${email}: ${otp}`);
        }

        await OTPService.sendDualOTP(user.phoneNumber, user.email, otp);

        res.status(200).json({
            message: 'Verification code has been sent to your email and phone.',
            userId: user._id
        });
    }
);

export const resetPasswordHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const { userId, otp, newPassword } = req.body;
        if (!userId || !otp || !newPassword) {
            throw new AppError('Missing required fields', 400);
        }

        // Validate new password strength
        if (newPassword.length < 8) {
            throw new AppError('Password must be at least 8 characters long', 400);
        }

        await OTPService.verifyOTP(userId, otp, 'password_reset');

        const user = await UserModel.findById(userId);
        if (!user) throw new AppError('User not found', 404);

        // Check if new password is same as old password (only if old password exists)
        if (user.password) {
            const isSamePassword = await comparePassword(newPassword, user.password);
            if (isSamePassword) {
                throw new AppError('New password cannot be the same as your current password', 400);
            }
        }

        user.password = await hashPassword(newPassword);
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    }
);

export const getProfileHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const user = await getUserProfile(userId);
        res.status(200).json(user);
    }
);

/**
 * POST /api/v1/auth/google
 * Google OAuth Authentication Handler
 */
export const googleAuthHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const { googleId, email, firstName, lastName } = req.body;

        if (!googleId || !email) {
            throw new AppError('Google ID and email are required', 400);
        }

        // Validate email format
        if (!validate.email(email)) {
            throw new AppError('Invalid email address format', 400);
        }

        // Import googleAuthUser from auth service
        const { googleAuthUser } = await import('../services/auth.service');

        const { user, token } = await googleAuthUser(
            googleId,
            email,
            firstName,
            lastName
        );

        res.status(200).json({
            message: 'Google authentication successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
            }
        });
    }
);
