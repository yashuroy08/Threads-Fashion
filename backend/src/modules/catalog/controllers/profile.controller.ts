import { Request, Response } from 'express';
import { UserModel } from '../../catalog/models/user.model';
import { OTPService } from '../services/otp.service';
import { asyncHandler } from '../../../common/utils/async-handler';
import { AppError } from '../../../common/errors/app-error';
import https from 'https';

const verifyZipCode = (zip: string): Promise<boolean> => {
    return new Promise((resolve) => {
        https.get(`https://api.postalpincode.in/pincode/${zip}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json && json[0] && json[0].Status === 'Success');
                } catch (err) {
                    resolve(false);
                }
            });
        }).on('error', (err) => {
            console.error('ZIP Verify Error:', err);
            resolve(true); // Don't block if API is down
        });
    });
};

export const getMyProfile = asyncHandler(
    async (req: Request, res: Response) => {
        const user = await UserModel.findById(req.user!.id).select(
            'firstName lastName email phoneNumber role gender addresses paymentMethods isPhoneVerified'
        );

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.status(200).json(user);
    }
);

export const updateMyProfile = asyncHandler(
    async (req: Request, res: Response) => {
        const { firstName, lastName, phoneNumber, addresses, paymentMethods, gender } = req.body;

        const user = await UserModel.findById(req.user!.id);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;

        if (phoneNumber !== undefined && phoneNumber !== user.phoneNumber) {
            // Check uniqueness if phone number is changing and not just being cleared
            if (phoneNumber !== '') {
                const existingUser = await UserModel.findOne({ phoneNumber });
                if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                    throw new AppError('This phone number is already registered with another account', 400);
                }
            }
            user.phoneNumber = phoneNumber === '' ? undefined : phoneNumber;
            // Reset verification status if phone changes
            user.isPhoneVerified = false;
        }

        if (gender !== undefined) user.gender = gender;

        if (addresses) {
            user.addresses = addresses;
        }

        if (paymentMethods) {
            user.paymentMethods = paymentMethods;
        }

        await user.save();

        res.status(200).json({
            message: 'Profile updated successfully',
        });
    }
);

export const addAddress = asyncHandler(
    async (req: Request, res: Response) => {
        const { street, city, state, zipCode, addressType } = req.body;

        // Validation
        if (!street || !city || !state || !zipCode || !addressType) {
            throw new AppError('All address fields are required', 400);
        }

        if (!['default', 'primary', 'secondary'].includes(addressType)) {
            throw new AppError('Address type must be default, primary, or secondary', 400);
        }

        // Verify ZIP Code
        const isValid = await verifyZipCode(zipCode);
        if (!isValid) {
            throw new AppError('Invalid ZIP Code provided. Could not verify location.', 400);
        }

        const user = await UserModel.findById(req.user!.id);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Enforce max 3 addresses
        if (user.addresses.length >= 3) {
            throw new AppError('Maximum 3 addresses allowed. Please delete an existing address first.', 400);
        }

        // Check if this address type already exists
        const existingAddressType = user.addresses.find(
            addr => addr.addressType === addressType
        );

        if (existingAddressType) {
            throw new AppError(`Address type '${addressType}' already exists. Please update the existing one or use a different type.`, 400);
        }

        // Add new address
        user.addresses.push({
            street,
            city,
            state,
            zipCode,
            addressType,
            isDefault: addressType === 'default'
        });

        await user.save();

        res.status(201).json({
            message: 'Address added successfully',
            addresses: user.addresses
        });
    }
);

export const deleteAddress = asyncHandler(
    async (req: Request, res: Response) => {
        const { addressType } = req.params;

        const user = await UserModel.findById(req.user!.id);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        const addressIndex = user.addresses.findIndex(
            addr => addr.addressType === addressType
        );

        if (addressIndex === -1) {
            throw new AppError('Address not found', 404);
        }

        user.addresses.splice(addressIndex, 1);
        await user.save();

        res.status(200).json({
            message: 'Address deleted successfully',
            addresses: user.addresses
        });
    }
);

export const updateAddress = asyncHandler(
    async (req: Request, res: Response) => {
        const { addressType } = req.params;
        const { street, city, state, zipCode } = req.body;

        const user = await UserModel.findById(req.user!.id);
        if (!user) throw new AppError('User not found', 404);

        const addressIndex = user.addresses.findIndex(addr => addr.addressType === addressType);

        if (addressIndex === -1) {
            throw new AppError('Address not found', 404);
        }

        if (zipCode) {
            const isValid = await verifyZipCode(zipCode);
            if (!isValid) {
                throw new AppError('Invalid ZIP Code provided. Could not verify location.', 400);
            }
        }

        // Update fields if provided
        if (street) user.addresses[addressIndex].street = street;
        if (city) user.addresses[addressIndex].city = city;
        if (state) user.addresses[addressIndex].state = state;
        if (zipCode) user.addresses[addressIndex].zipCode = zipCode;

        await user.save();

        res.status(200).json({
            message: 'Address updated successfully',
            addresses: user.addresses
        });
    }
);

export const listAllUsers = asyncHandler(
    async (req: Request, res: Response) => {
        const users = await UserModel.find().select('-password');
        res.status(200).json(users);
    }
);

export const adminUpdateUser = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const updates = req.body;

        const user = await UserModel.findById(id);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Allow updating everything except password and role (unless specified)
        if (updates.firstName !== undefined) user.firstName = updates.firstName;
        if (updates.lastName !== undefined) user.lastName = updates.lastName;
        if (updates.phoneNumber !== undefined) user.phoneNumber = updates.phoneNumber;
        if (updates.role !== undefined) user.role = updates.role;

        if (updates.addresses) {
            user.addresses = updates.addresses;
        }

        if (updates.paymentMethods) {
            user.paymentMethods = updates.paymentMethods;
        }

        await user.save();

        res.status(200).json({
            message: 'User updated successfully',
        });
    }
);

export const initiatePhoneVerification = asyncHandler(
    async (req: Request, res: Response) => {
        const user = await UserModel.findById(req.user!.id);
        if (!user) throw new AppError('User not found', 404);

        if (!user.phoneNumber) {
            throw new AppError('Please add a phone number to your profile first', 400);
        }

        // Strict Normalization: Strip everything except digits
        let digits = user.phoneNumber.replace(/\D/g, '');
        let normalizedPhone = '';

        if (digits.length === 10) {
            normalizedPhone = '+91' + digits;
        } else if (digits.length === 12 && digits.startsWith('91')) {
            normalizedPhone = '+' + digits;
        } else {
            // If manual/international entry seems valid (e.g. +1...), keep it but ensuring +
            // But for this specific project requirement (implied Indian context and +91 issues), 
            // we strictly enforce 10-digit local numbers => +91

            // Fallback: if it starts with + and looks like E.164, trust it?
            // But user logs showed +767... which was invalid.
            // So if it's 10 digits pretending to be +7..., we fix it.

            if (digits.length === 10) {
                normalizedPhone = '+91' + digits;
            } else {
                // Allow valid E.164 if explicitly provided properly?
                // For now, fail invalid formats to prevent junk data
                // Or just assume user.phoneNumber if we can't strict fix it
                throw new AppError('Invalid phone number format. Please provide a valid 10-digit mobile number.', 400);
            }
        }

        // Double check uniqueness before sending OTP
        // This handles cases where a user might have saved a non-normalized number that overlaps with a normalized one
        const existingUser = await UserModel.findOne({
            phoneNumber: normalizedPhone,
            _id: { $ne: user._id }
        });

        if (existingUser) {
            throw new AppError('This phone number is already registered with another account', 400);
        }

        // If the stored number was not normalized but we normalized it now, let's try to update it silently
        // to ensure consistency.
        if (user.phoneNumber !== normalizedPhone) {
            // We know it's unique now, so it's safe to update
            user.phoneNumber = normalizedPhone;
            await user.save();
        }

        if (user.isPhoneVerified) {
            throw new AppError('Phone number is already verified', 400);
        }

        const otp = await OTPService.generateOTP(user._id.toString(), 'phone_verification');

        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEV OTP PHONE VERIFY] OTP for ${user.phoneNumber}: ${otp}`);
        }

        // Send SMS
        const sent = await OTPService.sendSMS(user.phoneNumber, otp);

        if (!sent && process.env.NODE_ENV === 'development') {
            console.warn(`[DEV LOG] SMS sending failed for ${user.phoneNumber}. OTP is ${otp}`);
        } else if (!sent) {
            throw new AppError('Failed to send verification code. Please check the number and try again.', 500);
        }

        res.status(200).json({
            message: 'Verification code sent to your phone number'
        });
    }
);

export const completePhoneVerification = asyncHandler(
    async (req: Request, res: Response) => {
        const { otp } = req.body;
        if (!otp) throw new AppError('Verification code is required', 400);

        const user = await UserModel.findById(req.user!.id);
        if (!user) throw new AppError('User not found', 404);

        await OTPService.verifyOTP(user._id.toString(), otp, 'phone_verification');

        user.isPhoneVerified = true;
        await user.save();

        res.status(200).json({
            message: 'Phone number verified successfully'
        });
    }
);
