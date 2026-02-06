# 🏠 Address Management Updates

## ✅ Features Added
1.  **Edit Address:**
    *   Added a **Pencil Icon** to address cards in the Profile > Account section.
    *   Clicking the icon opens a modal to edit Street, City, State, and Zip Code.
    *   Updates are saved directly to the database via API.

## 🛠️ Backend Changes
1.  **Controller:** Added `updateAddress` to `profile.controller.ts`.
    *   Locates address by `addressType` (default/primary/secondary).
    *   Updates provided fields.
2.  **Routes:** Added `PUT /api/v1/profile/me/addresses/:addressType`.

## 🎨 Frontend Changes
1.  **Profile.tsx:**
    *   Added `editAddress` state and modal logic.
    *   Added `handleUpdateAddress` function to submit changes.
    *   Added Edit Button with `stopPropagation` to avoid triggering selection logic.

## 🚀 How to Test
1.  Go to **My Profile -> Account**.
2.  Scroll to **Saved Addresses**.
3.  Click the **Pencil Icon** on any address.
4.  Modify fields and click **Save Changes**.
5.  Verification: Refresh page to see persisted changes.
