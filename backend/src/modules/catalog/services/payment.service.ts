import Razorpay from 'razorpay';
import { AppError } from '../../../common/errors/app-error';

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

/**
 * Verify UPI VPA (Virtual Payment Address)
 * @param vpa - UPI ID to verify (e.g., user@okaxis)
 * @returns Verification result with customer name if valid
 */
export const verifyUpiVpa = async (vpa: string) => {
    try {
        // Validate VPA format first
        if (!vpa || !vpa.includes('@')) {
            throw new AppError('Invalid UPI ID format', 400);
        }

        // Call Razorpay VPA Validation API
        const response = await razorpay.payments.validateVpa({ vpa });

        return {
            isValid: response.success || false,
            customerName: response.customer_name || null,
            vpa: vpa
        };
    } catch (error: any) {
        console.error('UPI VPA Verification Error:', error);

        // Handle Razorpay API errors
        if (error.statusCode === 400) {
            return {
                isValid: false,
                customerName: null,
                vpa: vpa,
                error: 'Invalid UPI ID'
            };
        }

        throw new AppError('UPI verification failed. Please try again.', 500);
    }
};

/**
 * Create Razorpay Order for UPI payment
 * @param amount - Amount in paise (smallest currency unit)
 * @param orderId - Your internal order ID
 * @returns Razorpay order object
 */
export const createRazorpayOrder = async (amount: number, orderId: string) => {
    try {
        const options = {
            amount: amount, // Amount in paise
            currency: 'INR',
            receipt: orderId,
            payment_capture: 1, // Auto-capture payment
            notes: {
                order_id: orderId
            }
        };

        const razorpayOrder = await razorpay.orders.create(options);

        return {
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt
        };
    } catch (error: any) {
        console.error('Razorpay Order Creation Error:', error);
        throw new AppError('Failed to create payment order', 500);
    }
};

/**
 * Verify Razorpay payment signature
 * @param orderId - Razorpay order ID
 * @param paymentId - Razorpay payment ID
 * @param signature - Razorpay signature
 * @returns true if signature is valid
 */
export const verifyPaymentSignature = (
    orderId: string,
    paymentId: string,
    signature: string
): boolean => {
    try {
        const crypto = require('crypto');
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        return generatedSignature === signature;
    } catch (error) {
        console.error('Signature Verification Error:', error);
        return false;
    }
};

/**
 * Fetch payment details from Razorpay
 * @param paymentId - Razorpay payment ID
 * @returns Payment details
 */
export const fetchPaymentDetails = async (paymentId: string) => {
    try {
        const payment = await razorpay.payments.fetch(paymentId);
        return payment;
    } catch (error: any) {
        console.error('Fetch Payment Error:', error);
        throw new AppError('Failed to fetch payment details', 500);
    }
};

/**
 * Legacy payment processing (for COD and mock card payments)
 */
export const processPayment = async (
    amount: number,
    currency: string,
    method: 'card' | 'cod' | 'upi',
    details?: any
) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (method === 'card') {
        // Simple mock validation
        if (!details || !details.cardNumber) {
            throw new AppError('Invalid payment details', 400);
        }
        // Mock failure for a specific amount (e.g., test case)
        if (amount === 999999) {
            throw new AppError('Payment declined by bank', 402);
        }
    }

    return {
        transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        status: 'SUCCESS',
        timestamp: new Date()
    };
};

export default {
    verifyUpiVpa,
    createRazorpayOrder,
    verifyPaymentSignature,
    fetchPaymentDetails,
    processPayment
};