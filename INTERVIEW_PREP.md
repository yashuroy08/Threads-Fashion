# Threads Fashion: Full Stack E-Commerce Platform - Interview Preparation Notes

## 1. Project Overview
**Title**: Threads Fashion - Modern Full-Stack E-commerce Platform.
**Goal**: To build a scalable, secure, and user-friendly online shopping experience with features like real-time order tracking, secure payments, and admin management.
**Tech Stack**: MERN Stack (MongoDB, Express.js, React, Node.js) + TypeScript.

---

## 2. System Architecture (High Level Design)
The application follows a **Modular Monolithic Architecture**.
- **Frontend (Client)**: Built with React (Vite) for a fast Single Page Application (SPA). Uses `Context API` for state management (Cart, Auth) to avoid prop drilling.
- **Backend (API)**: Built with Node.js & Express.
  - **Controller Layer**: Handles HTTP requests, validation, and responses.
  - **Service Layer**: Contains business logic (e.g., "calculate total price", "generate OTP").
  - **Data Layer (Models)**: Mongoose schemas that interact with MongoDB Atlas.
- **Database**: MongoDB (NoSQL) for flexibility with product variants and scalable document storage.
- **Third-Party Services**:
  - **Razorpay**: Payment Gateway.
  - **Resend**: Transactional Email API.
  - **Twilio**: SMS OTP Service.
  - **Cloudinary/Uploads**: Image storage.

---

## 3. Database Schema Design
*Interview Tip: Explain WHY you chose these fields.*

### **User Schema**
- `email`: Unique index.
- `password`: Hashed using `bcrypt` (never stored in plain text).
- `role`: Enum ['user', 'admin'].
- `isVerified`: Boolean to track OTP verification status.

### **Product Schema (Optimized for E-commerce)**
- Uses **Embedded Documents** for variants (Size/Color).
- Structure:
  ```json
  {
    "title": "Classic Tee",
    "basePrice": 999,
    "variants": [
      { "color": "Red", "size": "M", "stock": 10, "priceModifier": 0 },
      { "color": "Blue", "size": "L", "stock": 5, "priceModifier": 50 }
    ],
    "category": ObjectId(Ref),
    "images": ["url1", "url2"]
  }
  ```
- **Why?**: Queries are faster. When a user views a product, they get all variants instantly without complex JOINs.

### **Order Schema**
- `items`: Stores a **snapshot** of the product data at the time of purchase.
  - *Critical*: If the product price changes next week, the historical order record must NOT change.
- `status`: Enum ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].
- `paymentId`: Links to Razorpay transaction.

---

## 4. Key Technical Implementations

### **A. Authentication & Security**
- **JWT (JSON Web Tokens)**: Used for stateless authentication.
  - **Access Token**: Short-lived (15m) for security.
- **OTP System**:
  - Dual-channel OTP (Email + SMS).
  - **Crypto**: Uses `crypto.randomInt` for secure random number generation.
  - **Hashing**: OTPs are hashed in the DB so even admins can't see them.
- **Security Middleware**:
  - `Helmet`: Sets secure HTTP headers.
  - `Eco-System`: Input sanitization to prevent NoSQL Injection.
  - `Rate Limiting`: Prevents brute-force attacks.

### **B. Payment Integration (Razorpay)**
- Implemented the standard workflow:
  1. **Create Order (Backend)**: Generate an Order ID from Razorpay.
  2. **Verify Payment (Backend)**: Receive `razorpay_signature` from frontend.
  3. **HMAC SHA256**: Cryptographically verify the signature on the server to prevent creating fake orders.

### **C. Email Service (The Resend API Pivot)**
- **Initial Plan**: Use standard SMTP (Nodemailer) just like in development.
- **Problem**: **Render (Cloud Hosting) blocks outbound SMTP ports (465, 587)** on the free tier to prevent spam. This caused all emails to timeout in production.
- **Solution**: Migrated to **Resend API**.
  - Uses HTTP (Port 443) which is whitelisted.
  - Implemented a "Smart Transport" pattern:
    - *If RESEND_API_KEY exists* -> Use HTTP API.
    - *Else* -> Fallback to SMTP (for local dev).

---

## 5. Challenges & Solutions (STAR Method for Interviews)

### **Challenge 1: The "Ghost User" Registration Bug**
- **Situation**: Users tried to register, didn't receive an OTP (due to network issues), and when they tried again, the system said "Email Already Registered".
- **Task**: Fix the registration flow to handle failures gracefully.
- **Action**:
  1. Implemented **Atomic Transactions**: If the OTP email fails to send, the system immediately **deletes** the user document created in that request.
  2. Added **Duplicate Detection Logs**: Logs the specific `_id` of conflict users to help admins debug.
- **Result**: A self-healing system where failed attempts don't block future success.

### **Challenge 2: Rate Limiting in Production**
- **Situation**: The `express-rate-limit` blocked legitimate users immediately after deployment.
- **Cause**: The app was behind a **Reverse Proxy** (Render's Load Balancer). All requests looked like they came from the same IP (the Balancer's IP).
- **Action**: Configured `app.set('trust proxy', 1)` in Express.
- **Result**: The app now correctly identifies the *real* client IP from the `X-Forwarded-For` header.

### **Challenge 3: Phone Number Alignment**
- **Situation**: The UI for the phone input was breaking on different screen sizes (icon overlapping text).
- **Action**: Refactored the CSS to use **Flexbox** with absolute positioning and `z-index` layering.
- **Result**: A responsive, cross-browser compatible input component.

---

## 6. Performance Optimizations
1.  **Index Everything**: Added indices on `email`, `orderId`, and `paymentId` for O(1) lookup speeds.
2.  **Projection**: API endpoints return only necessary data (e.g., `select('-password -__v')`) to reduce payload size.
3.  **Lazy Loading**: Frontend routes are loaded only when needed, reducing the initial bundle size.

---

## 7. Future Improvements
- **Redis Caching**: Cache product details to reduce database load.
- **Webhooks**: Use Razorpay Webhooks for more reliable payment confirmation (in case the user closes the browser before the success callback fires).
- **Message Queues (RabbitMQ)**: Offload email sending to a background worker so the user interface responds instantly.
