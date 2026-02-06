import rateLimit from 'express-rate-limit';
import { AppError } from '../errors/app-error';

export const otpRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // Limit each IP to 5 OTP requests per window
    message: 'Too many OTP requests from this IP, please try again after 5 minutes',
    handler: (req, res, next, options) => {
        throw new AppError(options.message, 429);
    },
    standardHeaders: true,
    legacyHeaders: false,
});
