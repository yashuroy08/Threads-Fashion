import { useParams, Link, useLocation } from 'react-router-dom';
import '../styles/orderSuccess.css';
import { Check, X } from 'lucide-react';
import { useEffect } from 'react';

export default function OrderSuccess() {
    const { orderId } = useParams();
    const location = useLocation();

    // Get address from location state or use a default/placeholder if not available
    const shippingAddress = location.state?.address;

    // Calculate a dummy delivery date (e.g., 5 days from now)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);

    const formattedDate = deliveryDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    // Format address string
    const addressString = shippingAddress
        ? `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}`
        : 'Your registered delivery address';

    useEffect(() => {
        // Scroll to top on mount
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="order-success-page">
            <div className="success-content-card">
                {/* Close Button */}
                <Link to="/" className="close-btn-corner">
                    <X size={24} />
                </Link>

                {/* 1. Checkmark Icon */}
                <div className="checkmark-container">
                    <div className="checkmark-circle">
                        <Check size={48} strokeWidth={3} className="checkmark-icon" />
                    </div>
                </div>

                {/* 2. Titles */}
                <h1 className="success-title">Thank You for Your Order!</h1>
                <p className="order-id-label">
                    Order <span className="order-number">#{orderId || 'TH-00000'}</span>
                </p>

                {/* 3. Divider */}
                <div className="success-divider"></div>

                {/* 4. Info Section */}
                <div className="info-box">
                    <div className="info-item">
                        <span className="info-label">Expected Delivery:</span>
                        <span className="info-value">{formattedDate}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Delivery to:</span>
                        <span className="info-value">{addressString}</span>
                    </div>
                </div>

                {/* 5. Action Buttons */}
                <div className="success-actions">
                    <Link to={`/order-tracking/${orderId}`} className="btn-success-track">
                        Track Order
                    </Link>
                    <Link to="/products" className="btn-success-continue">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}
