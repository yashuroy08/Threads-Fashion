# Project Visual Overview: Threads-Fashion

This document provides visual diagrams for the e-commerce platform's architecture, database schema, and directory structure.

---

## 🏛 Architecture Diagram

```mermaid
graph TD
    subgraph "Frontend Layer (React + Vite)"
        UI[User Interface]
        State[Context API / State]
        API_Call[Axios / Services]
    end

    subgraph "Backend Layer (Node.js + Express)"
        Router[Express Router]
        ACL[Auth Middleware / JWT]
        Controller[Controllers]
        Service[Services]
        Logger[Pino Logger]
    end

    subgraph "Data Layer (MongoDB + Mongoose)"
        Schema[Mongoose Models]
        DB[(MongoDB Database)]
    end

    subgraph "Third-Party Services"
        Payment[Razorpay API]
        SMS[Twilio / OTP]
        Email[Nodemailer]
    end

    UI --> State
    State --> API_Call
    API_Call --> Router
    Router --> ACL
    ACL --> Controller
    Controller --> Service
    Service --> Schema
    Schema --> DB
    Service --> Payment
    Service --> SMS
    Service --> Email
```

---

## 🗄 Database Schema (ERD)

```mermaid
erDiagram
    USER ||--o{ ORDER : "places"
    USER ||--o| CART : "owns"
    USER ||--o| WISHLIST : "manages"
    USER ||--o{ AUDIT_LOG : "triggers"
    
    CATEGORY ||--o{ PRODUCT : "contains"
    CATEGORY ||--o{ CATEGORY : "parent_of"
    
    PRODUCT ||--o{ ORDER_ITEM : "included_in"
    PRODUCT ||--o{ CART_ITEM : "in_cart"
    
    ORDER ||--o{ ORDER_ITEM : "has"
    CART ||--o{ CART_ITEM : "has"
    
    USER {
        string email
        string password
        string role
        boolean isVerified
    }
    
    PRODUCT {
        string name
        float price
        int stock
        string categoryId
    }

    ORDER {
        string userId
        float totalAmount
        string status
        string paymentId
    }

    CATEGORY {
        string name
        string slug
        string parentId
    }
```

---

## 📁 Project Folder Structure

```text
ecommerce-platform/
├── backend/                       # Node.js + Express + Mongoose
│   ├── src/
│   │   ├── app.ts                 # Application Initialization
│   │   ├── server.ts              # Entry point
│   │   ├── modules/
│   │   │   └── catalog/
│   │   │       ├── controllers/   # Request Handlers
│   │   │       ├── models/        # Mongoose Schema Definitions
│   │   │       ├── services/      # Business Logic
│   │   │       └── routes/        # API Endpoints
│   │   ├── common/                # Shared Utils & Logger
│   │   └── config/                # DB & Environment Config
│   └── package.json
├── frontend/                      # React + TypeScript + Vite
│   ├── src/
│   │   ├── api/                   # Axios instances
│   │   ├── components/            # Reusable UI Atoms/Molecules
│   │   ├── context/               # Global State (Auth, UI)
│   │   ├── hooks/                 # Business Logic Hooks
│   │   ├── pages/                 # Route-level components
│   │   ├── services/              # API implementation
│   │   ├── styles/                # CSS Stylesheets
│   │   └── utils/                 # Utilities & Constants
│   └── package.json
└── backend-spring/                # Spring Boot (Skeleton remains)
    ├── src/main/java/             # (Java source deleted)
    ├── src/main/resources/        # config/application.properties
    └── pom.xml
```
