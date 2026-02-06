import { useState, useEffect, useRef } from 'react';
import '../styles/auth.css';

declare const google: any;

interface GoogleButtonProps {
    onSuccess: (response: any) => void;
    onError?: (error: any) => void;
    text?: string;
}

export function GoogleSignInButton({ onSuccess, onError }: GoogleButtonProps) {
    const [loading, setLoading] = useState(false);
    const googleButtonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initializeGoogleSignIn = () => {
            if (typeof google !== 'undefined' && googleButtonRef.current) {
                try {
                    google.accounts.id.initialize({
                        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                        callback: handleCredentialResponse,
                    });

                    google.accounts.id.renderButton(googleButtonRef.current, {
                        theme: 'outline',
                        size: 'large',
                        width: googleButtonRef.current.parentElement?.offsetWidth || 300,
                        text: 'continue_with',
                        shape: 'rectangular',
                    });
                } catch (error) {
                    console.error('Failed to initialize Google Sign-In:', error);
                }
            }
        };

        // Check if google script is loaded, if not wait for it
        if (typeof google === 'undefined') {
            const timer = setInterval(() => {
                if (typeof google !== 'undefined') {
                    clearInterval(timer);
                    initializeGoogleSignIn();
                }
            }, 500);
            return () => clearInterval(timer);
        } else {
            initializeGoogleSignIn();
        }
    }, []);

    const handleCredentialResponse = async (response: any) => {
        setLoading(true);
        try {
            // Decode JWT token to get user info
            const userInfo = parseJwt(response.credential);

            const userData = {
                googleId: userInfo.sub,
                email: userInfo.email,
                firstName: userInfo.given_name,
                lastName: userInfo.family_name,
            };

            onSuccess(userData);
        } catch (error) {
            console.error('Error processing Google response:', error);
            if (onError) onError(error);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to decode JWT
    const parseJwt = (token: string) => {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    };

    return (
        <div className="google-btn-wrapper" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div ref={googleButtonRef} id="googleSignInButton"></div>
            {loading && <div className="google-loading-overlay">Verifying...</div>}
        </div>
    );
}
