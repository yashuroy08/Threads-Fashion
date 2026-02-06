import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import OTPVerification from '../components/OTPVerification';
import { forgotPassword, resendOTP } from '../api/auth.api';
import '../styles/auth.css';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = await forgotPassword(email);
            setUserId(data.userId);
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerificationSuccess = (otp: string) => {
        navigate('/reset-password', { state: { userId, email, otp } });
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* 
                    If submitted, OTPVerification handles its own back link and header. 
                    Ideally we usually want the parent to control this, but since OTPVerification 
                    is now 'smart' with its own design, we just render it.
                    However, OTPVerification's design has "Back to Login", which is correct for this flow too.
                */}

                {submitted && userId ? (
                    <OTPVerification
                        userId={userId}
                        type="password_reset"
                        onSuccess={handleVerificationSuccess}
                        onResend={() => resendOTP({ userId, type: 'password_reset' })}
                        loading={loading}
                    />
                ) : (
                    <>
                        <Link to="/login" className="auth-back-link">
                            <ArrowLeft size={18} />
                            <span>Back to Login</span>
                        </Link>

                        <div className="auth-icon-wrapper">
                            <Lock size={32} />
                        </div>

                        <div className="auth-header-centered">
                            <h2 className="auth-title">Forgot Password?</h2>
                            <p className="auth-subtitle">
                                No worries! Enter your email address below and we'll send you a code to reset your password.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form-compact">
                            <div className="form-group">
                                <label>EMAIL ADDRESS</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    required
                                />
                            </div>

                            {error && <div className="error-message-small">{error}</div>}

                            <button type="submit" className="submit-btn" disabled={loading || !email}>
                                {loading ? 'Sending...' : 'SEND RESET CODE'}
                            </button>

                            <div className="auth-footer-support" style={{ borderTop: 'none', paddingTop: '1rem' }}>
                                <span>Remember your password?</span>
                                <Link to="/login" style={{ color: '#111827', fontWeight: '700', textDecoration: 'none' }}>Sign In</Link>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
