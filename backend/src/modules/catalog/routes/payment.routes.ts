import { Router } from 'express';
import { verifyUpi, createPaymentOrder, verifyPayment, handleWebhook } from '../controllers/payment.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';

const router = Router();

/**
 * POST /api/v1/payments/verify-upi
 * Verify UPI VPA in real-time
 * Public endpoint (no auth required for verification)
 */
router.post('/verify-upi', verifyUpi);

/**
 * POST /api/v1/payments/create-order
 * Create Razorpay order
 * Requires authentication
 */
router.post('/create-order', authenticate, createPaymentOrder);

/**
 * POST /api/v1/payments/verify-payment
 * Verify Razorpay payment signature
 * Requires authentication
 */
router.post('/verify-payment', authenticate, verifyPayment);

/**
 * POST /api/v1/payments/webhook
 * Razorpay webhook handler
 * Public endpoint (verified via signature)
 */
router.post('/webhook', handleWebhook);

export default router;
