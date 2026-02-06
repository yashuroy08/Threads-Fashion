import { useState, useEffect } from 'react';
import '../styles/auth.css';
import { Mail, Lock } from 'lucide-react';

type Props = {
    mode: 'login' | 'register';
    onSubmit: (data: any) => void;
    loading: boolean;
    error?: string | null;
    success?: string | null;
};

export function AuthForm({ mode, onSubmit, loading, error, success }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    // Password Strength Logic
    const getStrength = (pass: string) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[a-z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        return score;
    };

    const strength = getStrength(password);
    const isStrong = strength >= 4; // Requirement: at least 4 criteria met (e.g. len+upper+lower+num)

    const requirements = [
        { label: "At least 8 characters", met: password.length >= 8 },
        { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
        { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
        { label: "Contains a number", met: /[0-9]/.test(password) },
        { label: "Contains special character", met: /[^A-Za-z0-9]/.test(password) },
    ];

    useEffect(() => {
        // Load persist data
        const savedData = sessionStorage.getItem(`auth_form_${mode}`);
        if (savedData) {
            const parsed = JSON.parse(savedData);
            if (parsed.email) setEmail(parsed.email);
            if (parsed.password) setPassword(parsed.password);
            if (parsed.confirmPassword) setConfirmPassword(parsed.confirmPassword);
            if (parsed.agreedToTerms) setAgreedToTerms(parsed.agreedToTerms);
        }
    }, [mode]);

    useEffect(() => {
        // Save data on change
        const data = { email, password, confirmPassword, agreedToTerms };
        sessionStorage.setItem(`auth_form_${mode}`, JSON.stringify(data));
    }, [email, password, confirmPassword, agreedToTerms, mode]);

    const [rememberMe, setRememberMe] = useState(false);

    // ... existing logic ...

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLocalError(null);

        const data: any = {
            email: email,
            password: password,
            rememberMe: rememberMe
        };

        if (mode === 'register') {
            data.confirmPassword = confirmPassword;

            if (data.password !== data.confirmPassword) {
                setLocalError("Passwords do not match");
                return;
            }

            if (password.length < 8) {
                setLocalError("Password must be at least 8 characters long");
                return;
            }

            if (!isStrong) {
                setLocalError("Password does not meet strength requirements");
                return;
            }

            if (!agreedToTerms) {
                setLocalError("You must agree to the Terms & Conditions and Privacy Policy to register");
                return;
            }
        }

        // Clear storage on submit success (optimistic)
        sessionStorage.removeItem(`auth_form_${mode}`);
        onSubmit(data);
    }

    const EyeIcon = ({ show }: { show: boolean }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {show ? (
                <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                </>
            ) : (
                <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                </>
            )}
        </svg>
    );

    return (
        <form onSubmit={handleSubmit} aria-busy={loading} className="auth-form-compact">
            <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                    <Mail className="input-icon" size={20} />
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
            </div>

            <div className="form-group">
                <label>Password</label>
                <div className="password-wrapper input-wrapper">
                    <Lock className="input-icon" size={20} />
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        placeholder={mode === 'register' ? 'Enter your password' : 'Password'}
                    />
                    <button
                        type="button"
                        className="eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        <EyeIcon show={showPassword} />
                    </button>
                </div>

                {mode === 'register' && (password || passwordFocused) && (
                    <div className="password-strength-container">
                        <div className="strength-bars">
                            {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                    key={level}
                                    className={`strength-bar ${strength >= level ? 'active' : ''} ${strength <= 2 ? 'weak' : strength <= 3 ? 'medium' : 'strong'
                                        }`}
                                />
                            ))}
                        </div>
                        <p className="strength-text">
                            Password Strength: <span className={strength <= 2 ? 'text-weak' : strength <= 3 ? 'text-medium' : 'text-strong'}>
                                {strength === 0 ? 'None' : strength <= 2 ? 'Weak' : strength <= 3 ? 'Medium' : 'Strong'}
                            </span>
                        </p>
                        <ul className="strength-requirements">
                            {requirements.map((req, index) => (
                                <li key={index} className={req.met ? 'met' : 'unmet'}>
                                    {req.met ? '✓' : '○'} {req.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {mode === 'register' && (
                <>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-options" style={{ marginTop: '0.5rem' }}>
                        <label className="remember-me" style={{ alignItems: 'flex-start' }}>
                            <input
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                style={{ marginTop: '0.2rem' }}
                            />
                            <span style={{ fontSize: '0.8rem', lineHeight: '1.4', color: '#6b7280' }}>
                                I agree to the <a href="/terms" style={{ color: '#111827', fontWeight: 600, textDecoration: 'none' }}>Terms & Conditions</a>, <a href="/privacy" style={{ color: '#111827', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a>.
                            </span>
                        </label>
                    </div>
                </>
            )}

            {mode === 'login' && (
                <div className="form-options">
                    <label className="remember-me">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span>Remember me</span>
                    </label>
                    <a href="/forgot-password" className="forgot-link">Forgot password?</a>
                </div>
            )}

            {(error || localError) && <div className="error-message-small">{error || localError}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit" className="submit-btn" disabled={loading || (mode === 'register' && !isStrong)}>
                {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
        </form>
    );
}