import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthForm } from '../components/AuthForm';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuth } from '../hooks/useAuth';
import OTPVerification from '../components/OTPVerification';
import { resendOTP } from '../api/auth.api';
import '../styles/auth.css';

export default function Login() {
    const {
        user, login, googleLogin, loading, error, success,
        needsVerification, pendingUserId, setNeedsVerification
    } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !needsVerification) {
            navigate('/');
        }
    }, [user, needsVerification, navigate]);

    const handleLogin = async (data: any) => {
        await login(data.email, data.password, data.rememberMe);
    };

    const handleGoogleSuccess = async (userData: any) => {
        const success = await googleLogin(userData);
        if (success) {
            navigate('/');
        }
    };

    const handleVerificationSuccess = () => {
        setNeedsVerification(false);
        navigate('/');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                {!needsVerification && (
                    <>


                        <div className="auth-header auth-header-centered">
                            <h2 className="auth-title">Sign in to your account</h2>
                            <p className="auth-subtitle">Welcome back! Please enter your details</p>
                        </div>
                    </>
                )}

                {needsVerification && pendingUserId ? (
                    <OTPVerification
                        userId={pendingUserId}
                        type="registration"
                        onSuccess={handleVerificationSuccess}
                        onResend={() => resendOTP({ userId: pendingUserId, type: 'registration' })}
                        loading={loading}
                        error={error}
                        onBack={() => setNeedsVerification(false)}
                    />
                ) : (
                    <>
                        <AuthForm
                            mode="login"
                            onSubmit={handleLogin}
                            loading={loading}
                            error={error}
                            success={success}
                        />

                        <div className="or-divider">
                            <span>Or continue with</span>
                        </div>

                        <GoogleSignInButton
                            onSuccess={handleGoogleSuccess}
                            onError={(err) => console.error('Google Sign-In Error:', err)}
                        />

                        {!needsVerification && (
                            <div className="auth-switch">
                                <span>
                                    Don't have an account?
                                    <Link to="/register">Sign up</Link>
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
