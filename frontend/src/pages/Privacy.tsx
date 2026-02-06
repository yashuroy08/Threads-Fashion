import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
    return (
        <div className="container" style={{ paddingTop: '6rem', paddingBottom: '8rem', maxWidth: '800px' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Privacy Policy</h1>
            <p className="secondary-text" style={{ marginBottom: '3rem' }}>Last Updated: January 2026</p>

            <section style={{ marginBottom: '3rem' }}>
                <h3 className="heading" style={{ marginBottom: '1rem' }}>1. Introduction</h3>
                <p className="secondary-text">
                    Welcome to Threads Fashion. We value your privacy and are committed to protecting your personal data.
                    This Privacy Policy explains how we collect, use, and safeguard your information when you
                    visit our website and use our services.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h3 className="heading" style={{ marginBottom: '1rem' }}>2. Data We Collect</h3>
                <ul className="secondary-text" style={{ paddingLeft: '1.5rem' }}>
                    <li>Personal identification information (Name, email address, phone number).</li>
                    <li>Shipping and billing addresses for order fulfillment.</li>
                    <li>Payment information (processed securely through encrypted third-party providers).</li>
                    <li>Usage data and cookies to improve your shopping experience.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h3 className="heading" style={{ marginBottom: '1rem' }}>3. How We Use Your Data</h3>
                <p className="secondary-text">
                    We use the information we collect to process your orders, manage your account,
                    communicate with you about promotions (if opted-in), and improve our website's functionality.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h3 className="heading" style={{ marginBottom: '1rem' }}>4. Data Security</h3>
                <p className="secondary-text">
                    We implement industry-standard security measures, including 256-bit SSL encryption,
                    to protect your personal information from unauthorized access or disclosure.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h3 className="heading" style={{ marginBottom: '1rem' }}>5. Your Rights</h3>
                <p className="secondary-text">
                    You have the right to access, correct, or delete your personal data at any time.
                    Please contact us at business@aura.com for any privacy-related inquiries.
                </p>
            </section>

            <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                <Link to="/register" className="back-nav-btn">
                    <ArrowLeft size={18} />
                    Back to Sign Up
                </Link>
            </div>
        </div>
    );
}
