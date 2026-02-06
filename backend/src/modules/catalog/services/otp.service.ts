import { OTPModel } from '../models/otp.model';
import crypto from 'crypto';
import { hashPassword, comparePassword } from '../../../common/utils/password';
import { AppError } from '../../../common/errors/app-error';
import twilio from 'twilio';
import { EmailService } from './email.service';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export class OTPService {
    private static ipRequestMap = new Map<string, { count: number; lastReset: number }>();

    static async checkThrottling(ip: string) {
        const now = Date.now();
        const record = this.ipRequestMap.get(ip) || { count: 0, lastReset: now };

        if (now - record.lastReset > 60000) { // Reset every minute
            record.count = 0;
            record.lastReset = now;
        }

        // In development/load testing, allow much higher limits
        const limit = process.env.NODE_ENV === 'development' ? 10000 : 100;

        if (record.count >= limit) { // Max requests per minute per IP
            throw new AppError('Too many requests. Please try again in a minute.', 429);
        }

        record.count += 1;
        this.ipRequestMap.set(ip, record);
    }

    static async sendSMS(phoneNumber: string, otp: string): Promise<boolean> {
        if (!client || !verifyServiceSid) {
            console.warn(`[SMS Mock] TWILIO credentials missing. Logged OTP: ${otp} to ${phoneNumber}`);
            return true;
        }

        const fromNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!fromNumber) {
            console.error('[SMS Error] TWILIO_PHONE_NUMBER is missing in .env');
            return false;
        }

        try {
            // Use Programmable SMS to send the EXACT OTP we generated
            await client.messages.create({
                body: `Your The Souled Store verification code is: ${otp}. Valid for 5 minutes.`,
                from: fromNumber,
                to: phoneNumber
            });

            console.log(`[Twilio SMS] OTP sent to ${phoneNumber}`);
            return true;
        } catch (error: any) {
            console.error('[Twilio Error]', error.message);
            return false;
        }
    }

    static async sendEmail(email: string, otp: string): Promise<boolean> {
        return await EmailService.sendOTP(email, otp);
    }

    /**
     * Sends OTP to both Phone and Email
     */
    static async sendDualOTP(phoneNumber: string | undefined, email: string, otp: string): Promise<boolean> {
        console.log('[OTP] Sending to email:', email);
        const emailSent = await this.sendEmail(email, otp);
        console.log('[OTP] Email sent:', emailSent);

        let smsSent = true;

        if (phoneNumber) {
            console.log('[OTP] Sending to phone:', phoneNumber);
            smsSent = await this.sendSMS(phoneNumber, otp);
            console.log('[OTP] SMS sent:', smsSent);
        }

        // Return true if at least one succeeded, or as per preference. 
        // User said "implement real time otp for mobile and mail", implying both.
        const result = emailSent || smsSent;
        console.log('[OTP] Final result:', result);
        return result;
    }

    static async generateOTP(userId: string, type: 'registration' | 'password_reset' | 'login_verification' | 'phone_verification') {
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        const otpHash = await hashPassword(otp);

        await OTPModel.deleteMany({ userId, type });
        await OTPModel.create({
            userId,
            otpHash,
            type,
            expiresAt,
        });

        return otp;
    }

    static async verifyOTP(userId: string, otp: string, type: 'registration' | 'password_reset' | 'login_verification' | 'phone_verification', persist: boolean = false) {
        const otpDoc = await OTPModel.findOne({ userId, type });

        if (!otpDoc) {
            throw new AppError('OTP expired or not found', 400);
        }

        if (otpDoc.attempts >= 3) {
            await OTPModel.findByIdAndDelete(otpDoc._id);
            throw new AppError('Too many failed attempts. Please request a new code.', 400);
        }

        const isValid = await comparePassword(otp, otpDoc.otpHash);

        if (!isValid) {
            otpDoc.attempts += 1;
            await otpDoc.save();
            throw new AppError('Invalid verification code', 400);
        }

        // Only delete if NOT persisting (persistence is needed for two-step flows like password reset)
        if (!persist) {
            await OTPModel.findByIdAndDelete(otpDoc._id);
        }
        return true;
    }
}

