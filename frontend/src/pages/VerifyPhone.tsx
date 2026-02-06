import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Lock, ArrowLeft, Send } from 'lucide-react';
import '../styles/otp.css';

const VerifyPhone = () => {
    const { user } = useAuthContext();
    const { notify } = useNotification();
    const navigate = useNavigate();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (user.isPhoneVerified) {
            navigate('/profile');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const effectRan = useRef(false);

    // Auto-focus first input and send OTP (only once)
    useEffect(() => {
        if (effectRan.current) return;

        sendOtp();
        const firstInput = document.getElementById('otp-0');
        if (firstInput) firstInput.focus();

        return () => {
            effectRan.current = true;
        }
    }, []);

    const handleChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return false;

        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

        // Focus next input
        if (element.value !== '') {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            if (otp[index] === '' && index > 0) {
                const prevInput = document.getElementById(`otp-${index - 1}`);
                if (prevInput) prevInput.focus();
            } else {
                setOtp([...otp.map((d, idx) => (idx === index ? '' : d))]);
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
        if (pastedData.every(char => !isNaN(Number(char)))) {
            const newOtp = [...otp];
            pastedData.forEach((val, i) => {
                if (i < 6) newOtp[i] = val;
            });
            setOtp(newOtp);
            const focusIndex = Math.min(pastedData.length, 5);
            document.getElementById(`otp-${focusIndex}`)?.focus();
        }
    };

    const sendOtp = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch('/api/v1/profile/me/verify-phone/init', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                // If the error is about duplicate number, redirect back to profile to fix it
                if (errData.message && errData.message.includes('already registered')) {
                    notify(errData.message, 'error');
                    setTimeout(() => navigate('/profile'), 2000);
                    return;
                }
                throw new Error(errData.message || 'Failed to send OTP');
            }

            notify('Verification code sent!', 'success');
            setResendTimer(60);
        } catch (err: any) {
            // Don't notify if it's just a duplicate/race condition in dev, but notify real errors
            if (err.message !== 'Failed to fetch') {
                notify(err.message, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async () => {
        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            notify('Please enter a valid 6-digit code', 'error');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch('/api/v1/profile/me/verify-phone/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ otp: otpValue })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Verification failed');
            }

            notify('Phone number verified successfully!', 'success');
            navigate('/profile');

        } catch (err: any) {
            notify(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Mask phone number (Hide first 6 digits of the 10-digit number)
    // E.g. +91 9876543210 -> +91 ******3210
    const getMaskedPhone = (phone: string | undefined) => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        // If it looks like 91 + 10 digits
        if (digits.length === 12 && digits.startsWith('91')) {
            const subscriber = digits.slice(2); // 10 digits
            const masked = '******' + subscriber.slice(6);
            return `+91 ${masked}`;
        }
        // Fallback for other formats
        if (phone.length > 6) {
            return phone.slice(0, 3) + '******' + phone.slice(-4);
        }
        return phone;
    }

    return (
        <div className="otp-container">
            <div className="otp-card">
                <button onClick={() => navigate('/profile')} className="otp-back-link">
                    <ArrowLeft size={18} /> Back to Profile
                </button>

                <h2 className="otp-title">Verify Phone Number</h2>
                <p className="otp-subtitle">
                    Enter the 6-digit code sent to your phone number
                </p>
                <div className="otp-phone-display">
                    {getMaskedPhone(user?.phoneNumber)}
                </div>

                <div className="otp-inputs-group">
                    {otp.map((data, index) => (
                        <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength={1}
                            value={data}
                            onChange={e => handleChange(e.target, index)}
                            onKeyDown={e => handleKeyDown(e, index)}
                            onPaste={handlePaste}
                            onFocus={e => e.target.select()}
                            className="otp-input-box"
                        />
                    ))}
                </div>

                <button
                    onClick={verifyOtp}
                    disabled={loading || otp.join('').length !== 6}
                    className="otp-verify-btn"
                >
                    {loading ? 'Verifying...' : <><Lock size={16} /> Verify & Continue</>}
                </button>

                <div className="otp-resend-container">
                    <p className="otp-resend-text">
                        Didn't receive the code?
                    </p>
                    {resendTimer > 0 ? (
                        <span className="otp-resend-link">
                            Resend in {resendTimer}s
                        </span>
                    ) : (
                        <button
                            onClick={sendOtp}
                            className="otp-resend-link active"
                            disabled={loading}
                        >
                            Resend Code <Send size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyPhone;
