import { Request, Response } from 'express';
import { verifyUpiVpa, createRazorpayOrder, verifyPaymentSignature, fetchPaymentDetails } from '../services/payment.service';
import { AppError } from '../../../common/errors/app-error';
import { OrderModel } from '../models/order.model';
import { validate } from '../../../common/utils/validators';

/**
 * POST /api/v1/payments/verify-upi
 * Verify UPI VPA in real-time
 */
export const verifyUpi = async (req: Request, res: Response) => {
    try {
        const { vpa } = req.body;

        if (!vpa) {
            throw new AppError('UPI ID is required', 400);
        }

        // Validate UPI ID format
        if (!validate.upiId(vpa)) {
            throw new AppError('Invalid UPI ID format. Please enter a valid UPI ID (e.g., username@paytm)', 400);
        }

        const result = await verifyUpiVpa(vpa);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error: any) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'UPI verification failed'
        });
    }
};

/**
 * POST /api/v1/payments/create-order
 * Create Razorpay order for UPI payment
 */
export const createPaymentOrder = async (req: Request, res: Response) => {
    try {
        const { amount, orderId } = req.body;

        if (!amount || !orderId) {
            throw new AppError('Amount and Order ID are required', 400);
        }

        const razorpayOrder = await createRazorpayOrder(amount, orderId);

        res.status(200).json({
            success: true,
            data: razorpayOrder
        });
    } catch (error: any) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to create payment order'
        });
    }
};

/**
 * POST /api/v1/payments/verify-payment
 * Verify Razorpay payment signature and update order status
 */
export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
            throw new AppError('Missing payment verification parameters', 400);
        }

        // Verify signature
        const isValid = verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            throw new AppError('Invalid payment signature', 400);
        }

        // Fetch payment details from Razorpay
        const paymentDetails = await fetchPaymentDetails(razorpay_payment_id);

        // Update order status
        const order = await OrderModel.findOne({ orderId });
        if (!order) {
            throw new AppError('Order not found', 404);
        }

        order.status = 'CONFIRMED';
        order.paymentInfo = {
            method: 'upi',
            transactionId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            paymentStatus: paymentDetails.status,
            paidAt: new Date()
        };

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            data: {
                orderId: order.orderId,
                status: order.status,
                paymentId: razorpay_payment_id
            }
        });
    } catch (error: any) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Payment verification failed'
        });
    }
};

/**
 * POST /api/v1/payments/webhook
 * Razorpay webhook handler for payment status updates
 */
export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'] as string;

        if (!webhookSecret) {
            console.error('Webhook secret not configured');
            return res.status(500).json({ success: false });
        }

        // Verify webhook signature
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('Invalid webhook signature');
            return res.status(400).json({ success: false });
        }

        const event = req.body.event;
        const payload = req.body.payload.payment.entity;

        console.log('Webhook Event:', event);

        // Handle different webhook events
        switch (event) {
            case 'payment.captured':
                // Payment successful
                const orderId = payload.notes?.order_id;
                if (orderId) {
                    const order = await OrderModel.findOne({ orderId });
                    if (order && order.status === 'PENDING') {
                        order.status = 'CONFIRMED';
                        // Ensure paymentInfo exists before updating
                        if (!order.paymentInfo) {
                            order.paymentInfo = {
                                method: 'upi',
                                transactionId: payload.id,
                                razorpayOrderId: payload.order_id
                            };
                        }
                        order.paymentInfo.paymentStatus = 'captured';
                        order.paymentInfo.paidAt = new Date();
                        await order.save();
                        console.log(`Order ${orderId} confirmed via webhook`);
                    }
                }
                break;

            case 'payment.failed':
                // Payment failed
                const failedOrderId = payload.notes?.order_id;
                if (failedOrderId) {
                    const order = await OrderModel.findOne({ orderId: failedOrderId });
                    if (order) {
                        order.status = 'FAILED';
                        // Ensure paymentInfo exists before updating
                        if (!order.paymentInfo) {
                            order.paymentInfo = {
                                method: 'upi',
                                transactionId: payload.id,
                                razorpayOrderId: payload.order_id
                            };
                        }
                        order.paymentInfo.paymentStatus = 'failed';
                        await order.save();
                        console.log(`Order ${failedOrderId} marked as failed via webhook`);
                    }
                }
                break;

            default:
                console.log(`Unhandled webhook event: ${event}`);
        }

        res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('Webhook Error:', error);
        res.status(500).json({ success: false });
    }
};

export default {
    verifyUpi,
    createPaymentOrder,
    verifyPayment,
    handleWebhook
};
