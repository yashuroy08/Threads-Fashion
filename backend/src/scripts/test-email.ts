// backend/src/scripts/test-email.ts
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for others
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    debug: true, // Show debug output
    logger: true  // Log to console
});

async function testEmail() {
    console.log('Testing Email Configuration...');
    console.log(`Host: ${process.env.SMTP_HOST}`);
    console.log(`Port: ${process.env.SMTP_PORT}`);
    // Credentials redacted for security


    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: process.env.SMTP_USER, // Send to self
            subject: 'Test Email from Debug Script',
            text: 'If you receive this, your SMTP configuration is correct!',
        });

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error: any) {
        console.error('❌ Email sending failed:', error.message);
        if (error.code === 'ETIMEDOUT') {
            console.error('Hint: Connection timed out. Check if your ISP blocks this port or if a firewall is active.');
        } else if (error.responseCode === 535) {
            console.error('Hint: Authentication failed. Check your password or App-Specific Password.');
        }
    }
}

testEmail();
