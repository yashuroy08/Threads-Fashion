# 📧 Notification System Upgrade

We have implemented a comprehensive notification system for Orders, Returns, Exchanges, and Cancellations.

## ✅ New Features
1.  **Automated Emails:**
    *   **Order Confirmation:** Sent immediately after placing an order.
    *   **Status Updates:** Sent when order is `SHIPPED`, `DELIVERED`, or `CANCELLED`.
    *   **Return Requests:** Sent when a user initiates a return.
    *   **Exchange Requests:** Sent when a user initiates an exchange. (Status updates to `EXCHANGE_REQUESTED`).

2.  **Order Logic Improvements:**
    *   **Returns:** Now updates status to `RETURN_REQUESTED` (previously just saved a reason).
    *   **Exchanges:** Now updates status to `EXCHANGE_REQUESTED`.
    *   **Inventory:** Cancellation automatically releases stock back to the correct variant.

## 🛠️ Technical Details
*   **EmailService:** Upgraded with HTML templates for all scenarios.
*   **OrderService:** Integrated `EmailService` calls into all state-changing functions.
*   **Frontend:** The `Profile > Orders` section is now fully wired to these backend processes.

## 🚀 How to Test
1.  **Place an Order:** You should see a console log `[Email] Sent to: ... | Subject: Order Confirmation...` (Backend Console).
2.  **Cancel Order:** Go to Profile -> Orders -> Cancel. Log: `[Email] ... | Subject: Order Update: CANCELLED`.
3.  **Return/Exchange:** Go to Profile -> Orders -> Return. Log: `[Email] ... | Subject: Return Request Received`.
