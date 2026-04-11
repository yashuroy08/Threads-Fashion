# Threads Fashion

A professional e-commerce platform featuring a high-fashion minimalist aesthetic. This application provides a comprehensive shopping experience with a focus on performance, visual consistency, and production-grade security.

## Core Features

- **Product Management**: SKU-level inventory tracking with support for multi-variant size and color mappings.
- **Authentication**: Secure JWT-based sessions, Google OAuth integration, and OTP-verified registration via Twilio and SMTP.
- **User Profile**: Advanced customer dashboard featuring multiple shipping address management and order history.
- **Transaction Flow**: Streamlined checkout process integrated with Razorpay and automated order status notifications via Email/SMS.
- **Order Tracking**: Real-time visualization of shipping progress with automated logic for returns and exchanges.
- **Security**: Implementation of Spring Security, JWT masking, and PII-sanitized logging.

## Tech Stack

- **Frontend**: React, Vite, Context API, Lucide React.
- **Backend**: Java 17, Spring Boot 3, MongoDB, Spring Security.
- **Infrastructure**: Dockerized Deployment, Twilio (SMS), SMTP/Zoho (Email), Razorpay (Payments).

## Environment Configuration

The following environment variables are required in the backend:

- `SPRING_DATA_MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Private key for token signing
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`: For payment processing
- `SPRING_MAIL_USERNAME` / `SPRING_MAIL_PASSWORD`: For email notifications (Zoho)
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`: For SMS verification
- `TWILIO_PHONE_NUMBER`: Your Twilio virtual number

## Running Locally

### Backend (Spring Boot)
1. Navigate to the backend directory: `cd backend-spring`
2. Ensure you have Java 17 and Maven installed.
3. Configure environment variables in `.env` (using spring-dotenv).
4. Start server: `mvn spring-boot:run`

### Frontend (React)
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Configure the `.env` file for `VITE_GOOGLE_CLIENT_ID`.
4. Start development server: `npm run dev`

## Deployment

This project is configured for containerized deployment on **Render** (via `render.yaml`) and Vercel (for the frontend). 

The backend is fully dockerized (see `backend-spring/Dockerfile`). To deploy:
1. Push to GitHub.
2. Connect the repository to Render.
3. Render will automatically detect the `render.yaml` Blueprint and provision the services.
