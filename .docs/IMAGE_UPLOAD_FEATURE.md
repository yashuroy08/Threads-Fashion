# Features Added: Image Upload System

## ✅ Capabilities
You can now upload images directly from your computer instead of pasting URLs.

## 🛠️ Components Added

### Backend
1.  **Upload Endpoint:** `POST /api/v1/upload`
2.  **Storage:** Images are saved to `backend/uploads/images/`
3.  **Static Serving:** Files are accessible at `http://localhost:5000/uploads/images/...` (or whatever your API port is)

### Frontend
1.  **ImageUploader Component:** A reusable upload button.
2.  **Admin Integration:** Added "Upload" buttons to:
    *   Main Product Image
    *   Additional Images (Color variants)

## 🚀 How to Use
1.  Go to **Admin** -> **Create/Edit Product**.
2.  In the **Media** tab...
3.  Click the small **"Upload"** button next to the URL field.
4.  Select a file from your computer.
5.  Wait for "Uploaded" checkmark ✅.
6.  The URL field will automatically fill with the local path.

## ⚠️ Notes
- Images are stored locally on your server.
- Maximum file size: **5MB**.
- Supported types: **Images only** (JPG, PNG, WEBP, etc).
