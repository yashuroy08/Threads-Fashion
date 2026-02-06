import { useState, useRef, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/auth.css';

interface Props {
    userId: string;
    type: 'registration' | 'password_reset' | 'login_verification';
    onSuccess: (otp: string) => void;
    onResend: () => Promise<void>;
    loading: boolean;
    error?: string | null;
    onBack?: () => void;
}

export default function OTPVerification({ userId, type, onSuccess, onResend, loading, error: externalError, onBack }: Props) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(60);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState(false);
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const fullOtp = otp.join('');
        if (fullOtp.length < 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setError(null);
        try {
            const response = await fetch('/api/v1/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, otp: fullOtp, type }),
            });

            const data = await response.json();
            if (response.ok) {
                setIsVerified(true);
                setTimeout(() => onSuccess(fullOtp), 1000);
            } else {
                setError(data.message || 'Verification failed');
            }
        } catch (err) {
            setError('Connection error');
        }
    };

    // Auto-submit when last digit is entered
    useEffect(() => {
        if (otp.join('').length === 6) {
            handleSubmit();
        }
    }, [otp]);

    const handleResend = async () => {
        if (timer > 0 || isResending) return;
        setIsResending(true);
        setError(null);
        try {
            await onResend();
            setTimer(60);
            setOtp(['', '', '', '', '', '']);
            inputs.current[0]?.focus();
        } catch (err) {
            setError('Failed to resend OTP');
        } finally {
            setIsResending(false);
        }
    };

    if (isVerified) {
        return (
            <div className="otp-success-view">
                <CheckCircle2 size={48} className="success-icon" />
                <h3>Verified Successfully</h3>
                <p>Proceeding...</p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            {onBack ? (
                <button
                    onClick={onBack}
                    className="auth-back-link"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                    <ArrowLeft size={18} />
                    <span>Back to Login</span>
                </button>
            ) : (
                <Link to="/login" className="auth-back-link">
                    <ArrowLeft size={18} />
                    <span>Back to Login</span>
                </Link>
            )}

            <div className="auth-icon-wrapper">
                <Mail size={32} />
            </div>

            <div className="otp-header">
                <h2 className="auth-title">Verify OTP</h2>
                <p className="auth-subtitle">
                    We've sent a 6-digit code to your email address. Please enter it below.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="otp-form">
                <div className="otp-segmented-inputs">
                    {otp.map((digit, idx) => (
                        <div key={idx} className={`otp-box ${digit ? 'filled' : ''}`}>
                            <input
                                ref={el => { inputs.current[idx] = el; }}
                                type="text"
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={1}
                                value={digit}
                                onChange={e => handleChange(idx, e.target.value)}
                                onKeyDown={e => handleKeyDown(idx, e)}
                                autoComplete="one-time-code"
                            />
                        </div>
                    ))}
                </div>

                {error && <div className="error-message-small">{error}</div>}
                {externalError && <div className="error-message-small">{externalError}</div>}

                <button type="submit" className="submit-btn-otp" disabled={loading || otp.join('').length < 6}>
                    {loading ? 'Verifying...' : 'VERIFY OTP'}
                </button>

                <div className="resend-wrapper">
                    <span>Didn't receive the code? </span>
                    {timer > 0 ? (
                        <span className="timer">Resend code in {timer}s</span>
                    ) : (
                        <button
                            type="button"
                            className="resend-link"
                            onClick={handleResend}
                            disabled={isResending}
                        >
                            {isResending ? <RefreshCw className="spin" size={14} /> : "Resend"}
                        </button>
                    )}
                </div>

                <div className="auth-footer-support">
                    <span>Need help?</span>
                    <a href="mailto:support@thesouledstore.com">Contact Support</a>
                </div>
            </form>
        </div>
    );
}
