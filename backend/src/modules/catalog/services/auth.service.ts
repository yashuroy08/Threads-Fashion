import { UserModel } from '../models/user.model';
import { AppError } from '../../../common/errors/app-error';
import { hashPassword, comparePassword } from '../../../common/utils/password';
import { signToken } from '../../../common/utils/jwt';

export const registerUser = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    gender?: 'male' | 'female' | 'other',
    country?: string,
    phoneNumber?: string
) => {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await UserModel.findOne({ email: normalizedEmail });
    if (existing) {
        throw new AppError('Email already registered', 409);
    }

    const hashed = await hashPassword(password);

    const userData: any = {
        firstName: firstName || '',
        lastName: lastName || '',
        email: normalizedEmail,
        password: hashed,
        country: country || '',
        gender: gender || '',
        isPhoneVerified: false,
        isEmailVerified: false,
        role: 'user',
    };

    if (phoneNumber) {
        userData.phoneNumber = phoneNumber.trim();
    }

    const user = await UserModel.create(userData);

    const token = signToken({
        id: user._id.toString(),
        role: user.role,
    });

    return { user, token };
};


export const loginUser = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
        throw new AppError('Invalid credentials', 401);
    }

    // Check if user has a password (not OAuth user)
    if (!user.password) {
        throw new AppError('Please login using Google', 401);
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
        throw new AppError('Invalid credentials', 401);
    }

    const token = signToken({
        id: user._id.toString(),
        role: user.role,
    });

    return { user, token };
};

export const getUserProfile = async (userId: string) => {
    const user = await UserModel.findById(userId).select('-password');
    if (!user) {
        throw new AppError('User not found', 404);
    }
    return user;
};

/**
 * Google OAuth Authentication
 * Creates new user or logs in existing user via Google
 */
export const googleAuthUser = async (
    googleId: string,
    email: string,
    firstName?: string,
    lastName?: string
) => {
    // Check if user exists with this Google ID
    let user = await UserModel.findOne({ googleId });

    if (!user) {
        // Check if user exists with this email (linking accounts)
        const normalizedEmail = email.trim().toLowerCase();
        user = await UserModel.findOne({ email: normalizedEmail });

        if (user) {
            // Link Google account to existing user
            user.googleId = googleId;
            user.isEmailVerified = true; // Google emails are verified
            if (firstName && !user.firstName) user.firstName = firstName;
            if (lastName && !user.lastName) user.lastName = lastName;
            await user.save();
        } else {
            // Create new user with Google account
            const userData: any = {
                googleId,
                email: normalizedEmail,
                firstName: firstName || '',
                lastName: lastName || '',
                isEmailVerified: true, // Google emails are pre-verified
                isPhoneVerified: false,
                role: 'user',
                country: '',
                gender: '',
            };

            // Avoid sending undefined/null to prevent sparse index conflicts
            const user = await UserModel.create(userData);
            return { user, token: signToken({ id: user._id.toString(), role: user.role }) };
        }
    }

    const token = signToken({
        id: user._id.toString(),
        role: user.role,
    });

    return { user, token };
};
