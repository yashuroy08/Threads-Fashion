import { createContext, useContext, useEffect, useState } from 'react';
import { loginUser, registerUser, getMe, googleAuth } from '../api/auth.api';

type User = {
    role: 'admin' | 'user';
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    mobile?: string;
    isPhoneVerified?: boolean;
};

type AuthContextType = {
    user: User | null;
    loading: boolean;
    error: string | null;
    success: string | null;
    needsVerification: boolean;
    pendingUserId: string | null;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
    register: (payload: any) => Promise<boolean>;
    googleLogin: (userData: any) => Promise<boolean>;
    logout: () => void;
    setNeedsVerification: (val: boolean) => void;
    setPendingUserId: (val: string | null) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [needsVerification, setNeedsVerification] = useState(false);
    const [pendingUserId, setPendingUserId] = useState<string | null>(null);

    useEffect(() => {
        // Check both storages
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            getMe(token)
                .then(u => setUser(u))
                .catch(() => {
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('token');
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    async function login(email: string, password: string, rememberMe: boolean = false) {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const data = await loginUser({ email, password });

            if (data.needsVerification) {
                setNeedsVerification(true);
                setPendingUserId(data.userId);
                setSuccess(data.message);
                return false;
            }

            if (rememberMe) {
                localStorage.setItem('token', data.token);
                sessionStorage.removeItem('token');
            } else {
                sessionStorage.setItem('token', data.token);
                localStorage.removeItem('token');
            }

            const userData = await getMe(data.token);
            setUser(userData);
            setSuccess('Login successful');
            return true;
        } catch (e: any) {
            setError(e.message);
            return false;
        } finally {
            setLoading(false);
        }
    }

    async function register(payload: any) {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const data = await registerUser(payload);
            setNeedsVerification(true);
            setPendingUserId(data.userId);
            setSuccess(data.message);
            return true;
        } catch (e: any) {
            setError(e.message);
            return false;
        } finally {
            setLoading(false);
        }
    }

    async function googleLogin(userData: any) {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const data = await googleAuth(userData);
            localStorage.setItem('token', data.token); // Google login defaults to remember usually, can be tweaked
            setUser(data.user);
            setSuccess('Google login successful');
            return true;
        } catch (e: any) {
            setError(e.message);
            return false;
        } finally {
            setLoading(false);
        }
    }

    function logout() {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        setUser(null);
        setSuccess(null);
        setError(null);
    }

    return (
        <AuthContext.Provider value={{
            user, loading, error, success, needsVerification, pendingUserId,
            login, register, googleLogin, logout, setNeedsVerification, setPendingUserId
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext)!;
