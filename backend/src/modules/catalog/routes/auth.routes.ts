import { Router } from 'express';
import {
    registerHandler,
    loginHandler,
    getProfileHandler,
    verifyOTPHandler,
    resendOTPHandler,
    forgotPasswordHandler,
    resetPasswordHandler,
    googleAuthHandler
} from '../controllers/auth.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateRegistration, validateLogin, handleValidationErrors } from '../../../common/middleware/auth.validator';
import { otpRateLimiter } from '../../../common/middleware/rate-limiter.middleware';

const router = Router();

router.post('/register', validateRegistration, handleValidationErrors, registerHandler);
router.post('/login', validateLogin, handleValidationErrors, loginHandler);
router.post('/google', googleAuthHandler); // Google OAuth route
router.get('/me', authenticate, getProfileHandler);

// OTP routes
router.post('/otp/verify', verifyOTPHandler);
router.post('/otp/resend', otpRateLimiter, resendOTPHandler);

// Password reset routes
router.post('/forgot-password', otpRateLimiter, forgotPasswordHandler);
router.post('/reset-password', resetPasswordHandler);

export default router;
