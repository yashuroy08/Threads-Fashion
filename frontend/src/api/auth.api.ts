const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function registerUser(payload: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    gender?: 'male' | 'female' | 'other';
    country?: string;
    phoneNumber?: string;
}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeout);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');
        return data;
    } catch (err: any) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            throw new Error('Registration timed out. The server might be waking up, please try again.');
        }
        throw err;
    }
}

export async function loginUser(payload: {
    email: string;
    password: string;
}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeout);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        return data;
    } catch (err: any) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            throw new Error('Sign in timed out. The server might be waking up, please try again.');
        }
        throw err;
    }
}

export async function verifyOTP(payload: { email: string; otp: string; type: string }) {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Verification failed');
    return data;
}

export async function resendOTP(payload: { email: string; type: string }) {
    const res = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to resend OTP');
    return data;
}

export async function forgotPassword(email: string) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to request reset');
    return data;
}

export async function resetPassword(payload: { email: string; otp: string; newPassword: string }) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Reset failed');
    return data;
}

export async function getMe(token: string) {
    const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch user');
    return data;
}

export async function googleAuth(payload: {
    googleId: string;
    email: string;
    firstName?: string;
    lastName?: string;
}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
        const res = await fetch(`${API_BASE}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeout);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Google authentication failed');
        return data;
    } catch (err: any) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            throw new Error('Google sign in timed out. The server might be waking up, please try again.');
        }
        throw err;
    }
}
