# Threads Fashion 🧵 

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Threads Fashion is a high-performance, minimalist e-commerce platform designed for professional fashion retail. Built with a modern **Java Spring Boot 3** backend and a **React + Vite** frontend, it offers a seamless shopping experience with production-grade security and scalable architecture.

---

## 📸 Project Overview

- **Minimalist Aesthetic**: Clean, high-fashion UI focused on product visualization.
- **Enterprise-ready Backend**: Refactored from Node.js to Spring Boot for enhanced type safety, performance, and security.
- **Robust Security**: JWT-based authentication, role-based access control (RBAC), and sanitization against XSS/NoSQL injections.
- **Full Lifecycle Order Management**: Automated order tracking, returns, exchanges, and payment integration.

---

## 🛠️ Tech Stack

### Backend (Spring Boot)
- **Core**: Java 17, Spring Boot 3.3.4
- **Security**: Spring Security 6, JJWT (JSON Web Token)
- **Database**: MongoDB (Atlas)
- **Communications**: Twilio SMS API, Zoho SMTP (Email)
- **Payments**: Razorpay Integration
- **Testing**: JUnit 5, MockMvc

### Frontend (React)
- **Framework**: React 18, Vite
- **State Management**: Context API
- **Styling**: Vanilla CSS (Tailwind Optional)
- **Icons**: Lucide React

---

## ⚙️ Configuration & Setup

### Prerequisites
- **Java 17+**
- **Node.js 18+**
- **Maven 3.8+**
- **Docker** (Optional for local running, required for deployment)

### 1. Database Setup
The project uses **MongoDB Atlas**. Ensure you have a cluster running and update your URI.

### 2. Environment Variables
Create a `.env` file in the `backend-spring` directory (or set them in your OS/IDE):

| Variable | Description |
| :--- | :--- |
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `MONGO_DB` | Target database name |
| `JWT_SECRET` | 32+ character secure key for JWT signing |
| `MAIL_USER` / `MAIL_PASS` | Zoho SMTP credentials |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay Dashboard API keys |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Twilio API credentials |
| `TWILIO_FROM_NUMBER` | Your Twilio virtual phone number |
| `PORT` | External port (defaults to 8081) |

---

## 🚀 Execution Guide

### Local Development

#### Backend
```bash
cd backend-spring
mvn spring-boot:run
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Containerization (Docker)
Build and run the entire stack using the provided Dockerfile:
```bash
cd backend-spring
docker build -t threads-backend .
docker run -p 8081:8081 --env-file .env threads-backend
```

---

## 📑 API Documentation

### Authentication (`/api/auth`)
- `POST /register`: New user registration with OTP trigger.
- `POST /login`: JWT retrieval via email/password.
- `POST /google`: OAuth2 integration.
- `POST /verify-otp`: Verification of registration/logins.
- `GET /me`: Authenticated session retrieval.

### Catalog (`/api/products`)
- `GET /`: List products with advanced filtering (sizes, colors, price, categories).
- `GET /search?q={query}`: Direct text search.
- `GET /featured`: High-lighted landing page products.
- `GET /{slugOrId}`: Detailed product view.

### Orders (`/api/orders`)
- `POST /`: Place a new order (requires secure session).
- `GET /my-orders`: Logged-in user's transaction history.
- `POST /cancel/{id}`: Order cancellation request.
- `POST /return/{id}`: Initiate return flow.

### Administrative (`/api/admin`)
*Protected by `ADMIN` role requirement.*
- `GET /admin/orders`: Global order management.
- `POST /admin/products`: Inventory injection.
- `PATCH /admin/status/{id}`: Order lifecycle management (Processing → Shipped → Delivered).

---

## 🚢 Deployment on Render

This project includes a `render.yaml` Blueprint for instant platform-as-a-service deployment.

1. Connect your GitHub repository to Render.
2. Select the **Blueprint** option.
3. Render will deploy the **Backend Web Service** using the `Dockerfile` and pull configuration from the Blueprint.
4. Manually add your sensitive secrets (API Keys) in the Render Dashboard under **Environment Variables**.

---

## 🤝 References & Contributing

- **Spring Boot Documentation**: [https://spring.io/](https://spring.io/)
- **Vite Guide**: [https://vitejs.dev/](https://vitejs.dev/)
- **Project Repository**: [https://github.com/yashuroy08/Threads-Fashion](https://github.com/yashuroy08/Threads-Fashion)

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

*Developed with precision for high-fashion digital commerce.*
