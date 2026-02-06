import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
    return (
        <div className="container" style={{ paddingTop: '6rem', paddingBottom: '8rem', maxWidth: '800px' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Terms of Service</h1>
            <p className="secondary-text" style={{ marginBottom: '3rem' }}>Last Updated: January 2026</p>

            <section style={{ marginBottom: '3rem' }}>
                <h3 className="heading" style={{ marginBottom: '1rem' }}>1. Agreement to Terms</h3>
                <p className="secondary-text">
                    By accessing or using the Threads Fashion website, you agree to be bound by these Terms of Service.
                    If you do not agree with any part of these terms, you may not use our services.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h3 className="heading" style={{ marginBottom: '1rem' }}>2. Use of the Site</h3>
                <p className="secondary-text">
                    You agree to use Threads Fashion only for lawful purposes. You are prohibited from violating or
                    attempting to violate the security of the site, including accessing data not intended for you.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h3 className="heading" style={{ marginBottom: '1rem' }}>3. Products and Pricing</h3>
                <p className="secondary-text">
                    All products and prices are subject to change without notice. We reserve the right to
                    refuse or cancel any order for any reason, including errors in pricing or availability.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h3 className="heading" style={{ marginBottom: '1rem' }}>4. Shipping and Returns</h3>
                <p className="secondary-text">
                    Shipping times are estimates and not guaranteed. Please refer to our Shipping Policy
                    for more details. Returns are accepted within 30 days of purchase, provided the items
                    are in their original condition.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h3 className="heading" style={{ marginBottom: '1rem' }}>5. Limitation of Liability</h3>
                <p className="secondary-text">
                    Threads Fashion shall not be liable for any direct, indirect, incidental, or consequential damages
                    resulting from the use of our products or services.
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
