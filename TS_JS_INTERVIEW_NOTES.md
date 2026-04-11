# TypeScript & JavaScript Interview Notes for Threads Fashion

## 1. JavaScript Basics & Core Concepts

### **Variables & Scope**
- **`var`**: Function-scoped. Can be re-declared. Hoisted (initialized as `undefined`). allow leaks.
- **`let`**: Block-scoped (`{}`). Can be re-assigned but not re-declared in the same scope. Not hoisted.
- **`const`**: Block-scoped. Cannot be re-assigned (immutable binding), but object properties *can* change.

### **Asynchronous JavaScript**
- **Promises**: Objects representing the eventual completion (or failure) of an asynchronous operation.
  - States: `Pending`, `Fulfilled` (Resolved), `Rejected`.
- **`async` / `await`**: Syntactic sugar over Promises. Makes async code look synchronous.
  - Used heavily in `auth.controller.ts` (e.g., `await UserModel.create(...)`).
- **Event Loop**: JS is single-threaded. The Event Loop moves async tasks (like `setTimeout` or `fetch`) to the "Callback Queue" and executes them only when the Call Stack is empty.

### **Key Functions**
- **Arrow Functions (`() => {}`)**:
  - Syntactic sugar for functions.
  - **Lexical `this`**: They don't have their own `this`; they inherit it from the parent scope.
- **Higher Order Functions**: Functions that take other functions as arguments (e.g., `.map()`, `.filter()`, `.reduce()`).

---

## 2. TypeScript Concepts (Used in Project)

### **Types vs Interfaces**
- **`interface`**: Defines the structure of an object. Can be extended (`extends`).
  - Example: `IUser` in `user.model.ts`.
- **`type`**: Can define primitives, unions, tuples, or objects.
  - Example: `type Role = 'admin' | 'user';`.

### **Key TS Keywords**
- **`any`**: Disables type checking. Avoid using it (use strict mode).
- **`unknown`**: Like `any`, but safer because you must check the type before using it.
- **`void`**: Return type for functions that don't return anything (e.g., `console.log`).
- **`enum`**: A set of named constants. (e.g., `OrderStatus { PENDING, SHIPPED }`).
- **`Generics <T>`**: Reusable components that work with a variety of types.
  - Used in: `AppResponse<T>` or `mongoose.Model<IUserDocument>`.

---

## 3. Important Keywords & Their Uses

| Keyword | Use | Project Example |
| :--- | :--- | :--- |
| **`export`** | Makes a module (function/class) available to other files. | `export const registerUser = ...` |
| **`import`** | Brings in exported modules. | `import { UserModel } from '../models/user'` |
| **`static`** | Defines a method/property on the Class itself, not instances. | `OTPService.sendDualOTP(...)` (Called without `new OTPService()`) |
| **`this`** | Refers to the current object context. | Used inside Mongoose methods (`this.password`). |
| **`extends`** | Creates a child class (Inheritance). | `class AppError extends Error` |
| **`implements`** | Enforces a class to satisfy a TS Interface. | `class User implements IUser` |
| **`try/catch`** | Handles errors gracefully. | Blocks crashing the server on failed DB calls. |

---

## 4. How Connections Are Established (Platform Interactions)

### **A. Frontend (React) ↔ Backend (Node/Express)**
*   **Protocol**: HTTP/HTTPS (Stateless).
*   **Key Tool**: `Axios` (HTTP Client).
*   **How it works**:
    1.  **Request**: React sends an HTTP Request (GET/POST) to the Backend URL (e.g., `api/v1/auth/login`).
    2.  **Headers**: Crucial data like `Authorization: Bearer <token>` or `Content-Type: application/json` is sent in headers.
    3.  **CORS (Cross-Origin Resource Sharing)**: The Backend (`app.ts`) has a whitelist (`cors({ origin: ['https://threads-fashion.vercel.app'] })`). If the request comes from an unknown domain, the browser blocks the connection.
    4.  **Response**: Backend sends back JSON data + Status Code (200 OK, 401 Unauthorized).

### **B. Backend (Node) ↔ Database (MongoDB Atlas)**
*   **Protocol**: TCP/IP (Persistent Connection).
*   **Key Tool**: `Mongoose` (ODM - Object Data Modeling).
*   **Connection String (URI)**: `mongodb+srv://<user>:<password>@cluster0...`
    - Contains the User, Password, Cluster address, and Database Name.
*   **How it works**:
    1.  `mongoose.connect(URI)` creates a **Pool** of connections.
    2.  Unlike HTTP (which opens/closes), DB connections stay **open** to handle multiple queries efficiently.
    3.  **Heartbeat**: Mongoose sends "pings" to Atlas to check if the connection is alive.

### **C. Backend ↔ Email Service (Resend/Zoho)**
*   **Protocol**: HTTP (API) or TCP (SMTP).
*   **Method 1: SMTP (original approach)**:
    - Opens a socket on Port 587/465.
    - Performs a "Handshake" (HELO/EHLO).
    - Authenticates with User/Pass.
    - Sends data chunks.
*   **Method 2: HTTP API (Resend approach)**:
    - Sends a standard POST request to `https://api.resend.com/emails`.
    - Authenticates via Header: `Authorization: Bearer <API_KEY>`.
    - **Why it worked**: Render blocked the SMTP ports (Network Layer), but allows HTTP requests (Application Layer).

---

## 5. Typical Interview Question Examples

**Q: What is the difference between `null` and `undefined`?**
A: `undefined` means a variable has been declared but not assigned a value. `null` is an assignment value (it means "no value").

**Q: How does the backend know who the user is?**
A: Through the **JWT Token**. The frontend sends the token in the `Authorization` header. The backend middleware (`protect`) decodes the token using the `JWT_SECRET` to get the `userId`.

**Q: Why do we hash passwords?**
A: To protect user data if the DB is compromised. We use `bcrypt` + `salt`. A "salt" is random data added to the password input so that two users with the same password ("123456") have different hashes.
