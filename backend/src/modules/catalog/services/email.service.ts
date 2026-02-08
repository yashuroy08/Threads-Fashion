import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
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
        if (!process.env.SMTP_USER && !process.env.SMTP_PASS) {
            console.warn(`[Email Mock] SMTP credentials missing. Logged OTP: ${otp} to ${email}`);
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
        // Use a specific logical tracking URL if available, otherwise default to orders list where tracking is usually available
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
                
                <p style="text-align: center; font-size: 12px; color: #888; margin-top: 20px;">
                    You can view your order details by clicking explicitly on the products above.
                </p>
            `)
        );
    }

    static async sendOrderStatusUpdate(email: string, order: any, status: string) {
        let message = '';
        let title = '';

        switch (status) {
            case 'SHIPPED':
                title = 'Your Order Has Shipped! 🚚';
                message = 'Your package is on its way. Get ready!';
                break;
            case 'DELIVERED':
                title = 'Order Delivered! 📦';
                message = 'Your package has arrived. We hope you love it!';
                break;
            case 'CANCELLED':
                title = 'Order Cancelled ❌';
                message = 'Your order has been cancelled as requested.';
                break;
            case 'RETURN_APPROVED':
                title = 'Return Approved ✅';
                message = 'Your return request has been approved. Please pack the item and wait for pickup.';
                break;
            case 'EXCHANGE_APPROVED':
                title = 'Exchange Approved 🔄';
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
        console.log(`[EmailService] Attempting to send email to: ${to} | Subject: ${subject}`);

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn(`[EmailService] SMTP credentials missing (User: ${!!process.env.SMTP_USER}, Pass: ${!!process.env.SMTP_PASS}). Using Mock mode.`);
            console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
            return true;
        }

        try {
            console.log(`[EmailService] Sending via SMTP host: ${process.env.SMTP_HOST || 'default'}`);
            await transporter.sendMail({
                from: `"Threads Fashion" <${process.env.SMTP_USER}>`,
                to,
                subject,
                text,
                html,
            });
            console.log(`[Email] Successfully sent to: ${to} | Subject: ${subject}`);
            return true;
        } catch (error: any) {
            console.error('[Email Error] Failed to send email:', error.message);
            console.error(error);
            return false;
        }
    }
}
