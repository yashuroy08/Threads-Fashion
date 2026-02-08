import nodemailer from 'nodemailer';
import https from 'https';

/**
 * SMTP Configuration for Email Service
 * 
 * Recommended Zoho Mail Settings:
 * - SMTP_HOST: smtp.zoho.com (free) or smtppro.zoho.com (paid)
 * - SMTP_PORT: 587 (recommended for most hosting platforms like Render)
 * - SMTP_SECURE: false (use STARTTLS with port 587)
 * - SMTP_USER: your full email address (e.g., threadsfashion@zohomail.in)
 * - SMTP_PASS: your password or app-specific password
 * 
 * Note: Port 465 (SSL) may be blocked by some hosting providers' firewalls.
 * Port 587 (STARTTLS) is more widely supported and recommended.
 */
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const useSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

console.log('[EmailService] SMTP Status:', {
    host: process.env.SMTP_HOST || 'smtp.zoho.in',
    port: smtpPort,
    secure: useSecure,
    user: process.env.SMTP_USER ? '***' + process.env.SMTP_USER.slice(-10) : 'NOT_SET'
});

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.zoho.in',
    port: smtpPort,
    secure: useSecure,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Connection timeout and socket timeout to fail faster
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    // TLS options for better compatibility
    tls: {
        // Relax certificate validation to troubleshoot timeouts
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
    },
    // Enable debug output in development
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
});

export class EmailService {
    // --- Helper for consistent styling ---
    private static wrapHtml(content: string) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #111; color: #fff; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">THREADS FASHION</h1>
                </div>
                <div style="padding: 20px; color: #333;">
                    ${content}
                </div>
                <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                    <p>&copy; ${new Date().getFullYear()} Threads Fashion. All rights reserved.</p>
                </div>
            </div>
        `;
    }

    static async sendOTP(email: string, otp: string) {
        // Fallback to console in development if no key is present
        if (!process.env.SMTP_USER && !process.env.SMTP_PASS && !process.env.RESEND_API_KEY) {
            console.warn(`[Email Mock] Credentials missing. Logged OTP: ${otp} to ${email}`);
            return true;
        }

        return this.sendEmail(email, 'Your Verification Code',
            `Your OTP is ${otp}.`,
            this.wrapHtml(`
                <h2>Verify Your Account</h2>
                <p>Your verification code is:</p>
                <h1 style="color: #111; letter-spacing: 5px; background: #f0f0f0; display: inline-block; padding: 10px 20px; border-radius: 4px;">${otp}</h1>
                <p>This code is valid for 5 minutes.</p>
            `)
        );
    }

    static async sendOrderConfirmation(email: string, order: any) {
        const total = (order.total / 100).toFixed(2);

        const deliveryDate = order.estimatedDeliveryDate
            ? new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
            : '7-10 days';

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const ordersUrl = `${frontendUrl}/account/orders`;
        const trackingUrl = `${frontendUrl}/orders/${order.orderId}`;

        const itemsHtml = order.items.map((item: any) =>
            `<div style="display: flex; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 12px;">
                ${item.image ? `<a href="${ordersUrl}" style="text-decoration: none; border: none;"><img src="${item.image}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; margin-right: 12px; border: none;" /></a>` : ''}
                <div style="flex: 1;">
                    <a href="${ordersUrl}" style="text-decoration: none; color: inherit;">
                        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #111;">${item.title}</div>
                    </a>
                    <div style="color: #666; font-size: 12px;">
                        ${item.size ? `Size: ${item.size}` : ''} 
                        ${item.color ? ` • Color: ${item.color}` : ''} 
                        • Qty: ${item.quantity}
                    </div>
                </div>
                <div style="font-weight: 600;">₹${(item.price / 100).toFixed(2)}</div>
             </div>`
        ).join('');

        return this.sendEmail(email, `Order Confirmation #${order.orderId}`,
            `Thank you for your order! Total: ₹${total}`,
            this.wrapHtml(`
                <h2>Order Confirmed! 🎉</h2>
                <p>Hi there,</p>
                <p>Thank you for shopping with us. Your order <strong>#${order.orderId}</strong> has been placed successfully.</p>
                <div style="background: #e8f5e9; padding: 10px 15px; border-radius: 4px; margin: 15px 0; color: #1b5e20;">
                    <strong>Estimated Delivery:</strong> ${deliveryDate}
                </div>
                <div style="margin: 20px 0; background: #f9f9f9; padding: 15px; border-radius: 4px;">
                    <h3>Order Summary</h3>
                    ${itemsHtml}
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 10px 0;" />
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Payment Method</span>
                        <span style="font-weight: 600;">${(order.paymentMethod || 'Card').toUpperCase()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold;">
                        <span>Total</span>
                        <span>₹${total}</span>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
                    <a href="${trackingUrl}" style="background-color: #111; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Track Your Order</a>
                </div>
            `)
        );
    }

    static async sendOrderStatusUpdate(email: string, order: any, status: string) {
        let title = '';
        let message = '';
        switch (status) {
            case 'SHIPPED':
                title = 'Your Order Has Shipped! ';
                message = 'Your package is on its way. Get ready!';
                break;
            case 'DELIVERED':
                title = 'Order Delivered! ';
                message = 'Your package has arrived. We hope you love it!';
                break;
            case 'CANCELLED':
                title = 'Order Cancelled ';
                message = 'Your order has been cancelled as requested.';
                break;
            case 'RETURN_APPROVED':
                title = 'Return Approved ';
                message = 'Your return request has been approved. Please pack the item and wait for pickup.';
                break;
            case 'EXCHANGE_APPROVED':
                title = 'Exchange Approved ';
                message = 'Your exchange request has been approved. We will pick up the old item soon.';
                break;
            default:
                title = `Order Updated: ${status}`;
                message = `The status of your order #${order.orderId} has changed to ${status}.`;
        }

        return this.sendEmail(email, `Order Update: ${status} - #${order.orderId}`,
            message,
            this.wrapHtml(`
                <h2>${title}</h2>
                <p>Hi there,</p>
                <p>${message}</p>
                <p style="margin-top: 20px;">Order ID: <strong>#${order.orderId}</strong></p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/orders" style="display: inline-block; background: #111; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px;">View Order</a>
            `)
        );
    }

    static async sendReturnRequestReceived(email: string, order: any) {
        return this.sendEmail(email, `Return Request Received - #${order.orderId}`,
            `We received your return request for order #${order.orderId}.`,
            this.wrapHtml(`
                <h2>Return Request Received</h2>
                <p>We've received your request to return items from order <strong>#${order.orderId}</strong>.</p>
                <p>Our team will review it shortly and update you on the status.</p>
            `)
        );
    }

    static async sendExchangeRequestReceived(email: string, order: any) {
        return this.sendEmail(email, `Exchange Request Received - #${order.orderId}`,
            `We received your exchange request for order #${order.orderId}.`,
            this.wrapHtml(`
                <h2>Exchange Request Received</h2>
                <p>We've received your request to exchange items from order <strong>#${order.orderId}</strong>.</p>
                <p>Our team will review it shortly and update you on the status.</p>
            `)
        );
    }

    // --- Core Sender ---
    private static async sendEmail(to: string, subject: string, text: string, html: string) {
        // Priority 1: Resend API (HTTP-based, bypasses Render's SMTP port block)
        if (process.env.RESEND_API_KEY) {
            console.log(`[EmailService] Using Resend API for: ${to}`);
            return new Promise<boolean>((resolve) => {
                const data = JSON.stringify({
                    from: process.env.RESEND_FROM || 'Threads Fashion <onboarding@resend.dev>',
                    to: [to],
                    subject: subject,
                    text: text,
                    html: html,
                });

                const options = {
                    hostname: 'api.resend.com',
                    path: '/emails',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    },
                };

                const req = https.request(options, (res) => {
                    let body = '';
                    res.on('data', (chunk) => body += chunk);
                    res.on('end', () => {
                        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                            console.log(`[Resend] Successfully sent to: ${to}`);
                            resolve(true);
                        } else {
                            console.error(`[Resend Error] Status: ${res.statusCode}`);
                            if (res.statusCode === 403) {
                                console.error('\n=== RESEND SANDBOX RESTRICTION ===');
                                console.error('You are in Sandbox Mode. You can ONLY send emails to:');
                                console.error('  yashwanthp2335.sse@saveetha.com');
                                console.error('\nTo send to ANY email address, you MUST:');
                                console.error('1. Go to resend.com/domains');
                                console.error('2. Add and verify your own domain.');
                                console.error('===================================\n');
                            }
                            console.error(`[Resend Body] ${body}`);
                            resolve(false);
                        }
                    });
                });

                req.on('error', (error) => {
                    console.error('[Resend Error] Network error:', error.message);
                    resolve(false);
                });

                req.write(data);
                req.end();
            });
        }

        // Priority 2: SMTP (Standard way, often blocked on cloud free tiers)
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn(`[EmailService] No Resend API Key and no SMTP credentials. Using Mock mode.`);
            console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
            return true;
        }

        try {
            console.log(`[EmailService] Attempting SMTP delivery via: ${process.env.SMTP_HOST || 'zoho.in'}`);
            await transporter.sendMail({
                from: `"Threads Fashion" <${process.env.SMTP_USER}>`,
                to,
                subject,
                text,
                html,
            });
            console.log(`[Email] Successfully sent via SMTP to: ${to}`);
            return true;
        } catch (error: any) {
            console.error('[Email Error] SMTP delivery failed:', error.message);
            if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
                console.error('--- RENDER DETECTED: SMTP IS BLOCKED ---');
                console.error('Render blocks SMTP ports on the free tier.');
                console.error('FIX: Get a free API key from resend.com and add it as RESEND_API_KEY');
            }
            return false;
        }
    }
}
