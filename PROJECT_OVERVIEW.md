# Project Overview: Threads-Fashion

This document provides a comprehensive overview of the project's folder structure, database schema, and architecture.

---

## 🏗 Project Architecture

The project is structured as a full-stack e-commerce platform with a clear separation of concerns between the frontend and multiple backend implementations.

### 🧩 Components
1.  **Frontend**: A React-based application providing the user interface for both customers and administrators.
2.  **Backend (Node.js)**: The primary backend service built with Express.js and Mongoose, following a modular architecture.
3.  **Backend-Spring**: A secondary backend implementation using Spring Boot (Java files were recently removed, leaving the project structure).
4.  **Database**: MongoDB is used as the primary data store, managed through Mongoose models in the Node.js backend.

---

## 📁 Folder Structure

```text
ecommerce-platform/
├── backend/                # Node.js Express Backend
│   ├── src/
│   │   ├── app.ts          # Express application setup
│   │   ├── server.ts       # Server entry point
│   │   ├── modules/        # Module-based business logic
│   │   │   └── catalog/    # Catalog module (Products, Users, Orders)
│   │   │       ├── controllers/
│   │   │       ├── models/ # Mongoose models (DB Schema)
│   │   │       ├── services/
│   │   │       └── routes/
│   │   ├── config/         # Environment and DB configurations
│   │   └── common/         # Shared utilities and loggers
│   └── package.json        # Dependencies (Express, Mongoose, Pino)
├── backend-spring/         # Spring Boot Backend (Structure only)
│   ├── src/
│   │   └── main/
│   │       ├── java/       # (Java files removed)
│   │       └── resources/  # Application properties
│   └── pom.xml             # Maven configuration
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page-level components
│   │   ├── context/        # State management (AuthContext, etc.)
│   │   ├── services/       # API interaction layer
│   │   ├── hooks/          # Custom React hooks
│   │   └── styles/         # Vanilla CSS styling
│   └── package.json        # Frontend dependencies
└── README.md               # Project documentation
```

---

## 🗄 Database Schema (Mongoose Models)

The system uses MongoDB with the following primary collections defined in `backend/src/modules/catalog/models/`:

| Collection | Description | Key Fields |
| :--- | :--- | :--- |
| **Users** | User accounts and profiles | `email`, `password`, `role`, `isVerified` |
| **Products** | Inventory items | `name`, `price`, `category`, `stock`, `variants` |
| **Categories** | Product groupings | `name`, `slug`, `parentCategory` |
| **Orders** | Transaction records | `user`, `items`, `totalAmount`, `status`, `paymentId` |
| **Cart** | Active shopping sessions | `user`, `items` |
| **Wishlist** | User saved items | `user`, `products` |
| **Audit Logs** | System activity tracking | `action`, `performedBy`, `timestamp` |
| **OTP** | Verification codes | `email`, `code`, `expiresAt` |
| **Admin Settings**| Global store configs | `storeName`, `bannerSettings`, `contactInfo` |

---

## 🚀 Key Technologies

- **Frontend**: React, TypeScript, CSS, Axios, Context API.
- **Backend**: Node.js, Express, TypeScript, Mongoose.
- **Logging**: Pino (Backend).
- **Authentication**: JWT, Bcrypt, OTP (Email/SMS via Twilio).
- **Payments**: Razorpay integration.
- **Architecture Pattern**: MVC (Model-View-Controller) within a Modular Backend.
