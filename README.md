<<<<<<< HEAD
# Threads-Fashion
Professional MERN e-commerce platform featuring a high-fashion minimalist aesthetic. Includes variant-level inventory, JWT/Google authentication, real-time WebSocket order tracking, and secure checkout. Optimized for high-performance deployment and production-grade security infrastructure.
=======
# Threads Fashion

A professional MERN-stack e-commerce platform featuring a high-fashion minimalist aesthetic. This application provides a comprehensive shopping experience with a focus on performance, visual consistency, and production-grade security.

## Core Features

- **Product Management**: SKU-level inventory tracking with support for multi-variant size and color mappings.
- **Authentication**: Secure JWT-based sessions, Google OAuth integration, and OTP-verified registration via Twilio and SMTP.
- **User Profile**: Advanced customer dashboard featuring multiple shipping address management and order history.
- **Transaction Flow**: Streamlined checkout process integrated with Razorpay and automated order status notifications via WebSockets.
- **Order Tracking**: Real-time visualization of shipping progress with automated logic for returns and exchanges.
- **Security**: Implementation of Helmet.js, NoSQL injection protection, and Draft-7 compliant rate limiting.

## Tech Stack

- **Frontend**: React, Vite, Context API, Lucide React.
- **Backend**: Node.js, Express, MongoDB, Mongoose.
- **Infrastructure**: Socket.io for real-time updates, Twilio for SMS, SMTP for email notifications.

## Environment Configuration

The following environment variables are required in the backend:

- PORT: Server port (default 5000)
- MONGO_URI: MongoDB connection string
- JWT_SECRET: Private key for token signing
- FRONTEND_URL: Authorized origin for CORS
- TWILIO_ACCOUNT_SID / AUTH_TOKEN: For SMS verification
- SMTP_HOST / PASS: For email notifications
- RAZORPAY_KEY_ID / SECRET: For payment processing

## Running Locally

### Backend
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Configure the `.env` file based on `.env.example`.
4. Start development server: `npm run dev`

### Frontend
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Configure the `.env` file for `VITE_GOOGLE_CLIENT_ID`.
4. Start development server: `npm run dev`

## Deployment

This project is configured as a monorepo suitable for deployment on platforms such as Vercel and Render. Ensure all environment variables are correctly mapped in the production host and the CORS whitelist is updated to the production domain.
>>>>>>> 6ab5ce3 (Docs: Add professional project README)
