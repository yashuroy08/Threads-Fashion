# How to Test Your App on Mobile (Ngrok & Local IP)

Since you asked for "grok", you likely meant **ngrok**, a popular tool to create public URLs for your local server.

## Option 1: The Quickest Way (Local Network)
Since your `vite.config.ts` is already configured with `host: '0.0.0.0'`, you can access your app directly via your computer's IP address if your phone is on the **same Wi-Fi network**.

1.  Open a terminal on your computer and find your IP address:
    *   **Windows**: Run `ipconfig` and look for "IPv4 Address" (e.g., `192.168.1.5`).
    *   **Mac/Linux**: Run `ifconfig` or check Network settings.
2.  On your phone, open Chrome/Safari.
3.  Type: `http://<YOUR_IP_ADDRESS>:3000`
    *   Example: `http://192.168.1.5:3000`

---

## Option 2: Using Ngrok (Public Link)
Use this if you are on different networks (e.g., phone is on 4G/5G) or need a secure (HTTPS) link.

### 1. Create an Ngrok Account
Go to [dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup) and create a free account to get your **Authtoken**.

### 2. Install Ngrok
Run this command in your VS Code terminal (you only need to do this once):
```bash
npm install -g ngrok
```
*Alternatively, you can download it from the ngrok website.*

### 3. Connect Your Account
Copy your Authtoken from the ngrok dashboard and run:
```bash
ngrok config add-authtoken <YOUR_TOKEN_HERE>
```

### 4. Get Your Link
Run the following command to expose your frontend (running on port 3000):
```bash
ngrok http 3000
```

### 5. Open on Phone
Copy the `https://....ngrok-free.app` link shown in the terminal and send it to your phone (e.g., via WhatsApp, Email, or Slack).

> **Note**: When you open the link, ngrok will show a "browser warning" page. Click "Visit Site" to proceed.

## Troubleshooting
- **API Issues**: If your frontend loads but data is missing, it might be because the frontend is trying to call `localhost:5000` for the API. Since your phone doesn't know what `localhost` is (that refers to the phone itself), this might fail.
    - **Fix**: The current setup intentionally proxies `/api` calls through the Vite server (`port 3000`). So as long as you visit the port 3000 link, API calls should work correctly via the proxy!
