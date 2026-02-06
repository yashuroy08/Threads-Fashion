import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuthContext } from '../context/AuthContext';
import ReasonModal from '../components/ReasonModal';
import { OrderApi } from '../api/orders.api';
import {
    CheckCircle,
    Package,
    Truck,
    Home,
    MapPin,
    Calendar,
    ArrowLeft,

} from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import '../styles/order-tracking.css';

// Timeline Data Config
const TIMELINE_STEPS = [
    { status: 'PENDING', label: 'Order Placed', description: 'Your order has been placed', icon: CheckCircle },
    { status: 'PAID', label: 'Processing', description: 'We are packing your items', icon: Package },
    { status: 'SHIPPED', label: 'Shipped', description: 'Your order is on the way', icon: Truck },
    { status: 'DELIVERED', label: 'Delivered', description: 'Order has been delivered', icon: Home }
];

export default function OrderTracking() {
    const { orderId } = useParams();
    const { user } = useAuthContext();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [sellerCity, setSellerCity] = useState<string>('');
    const socket = useSocket();

    const fetchOrder = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setOrder(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (order?.sellerZipCode && order.sellerZipCode.toString().length === 6) {
            fetch(`https://api.zippopotam.us/IN/${order.sellerZipCode}`)
                .then(res => {
                    if (!res.ok) throw new Error('Not found');
                    return res.json();
                })
                .then(data => {
                    if (data.places && data.places.length > 0) {
                        setSellerCity(data.places[0]['place name']);
                    }
                })
                .catch(() => setSellerCity('Seller Location'));
        }
    }, [order?.sellerZipCode]);

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    useEffect(() => {
        if (!socket) return;
        socket.on('order_update', (updatedOrder: any) => {
            if (updatedOrder.orderId === orderId) {
                setOrder(updatedOrder);
            }
        });
        return () => {
            socket.off('order_update');
        };
    }, [socket, orderId]);

    if (loading) return <div className="tracking-container" style={{ padding: '2rem' }}>Loading tracking info...</div>;
    if (!order) return <div className="tracking-container" style={{ padding: '2rem' }}>Order not found</div>;

    const statusOrder = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED'];
    const getStepState = (stepStatus: string) => {
        if (order.status === 'CANCELLED') return 'inactive';
        const currentIdx = statusOrder.indexOf(order.status);
        const stepIdx = statusOrder.indexOf(stepStatus);

        if (currentIdx === -1) return 'inactive';

        if (stepIdx < currentIdx) return 'completed';
        if (stepIdx === currentIdx) return 'current';
        return 'inactive';
    };

    const estimatedDelivery = order.estimatedDeliveryDate
        ? new Date(order.estimatedDeliveryDate)
        : new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000);

    const distanceKm = order.distanceKm || 0;

    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Guest User';

    return (
        <div className="tracking-container">
            {/* Breadcrumb - Desktop Only */}
            <div style={{ marginBottom: '1rem', display: 'none' }} className="desktop-only">
                <Breadcrumb items={[
                    { label: 'My Account', href: '/profile' },
                    { label: 'Order Tracking', href: `/orders/${orderId}` }
                ]} />
            </div>

            {/* Header */}
            <header className="tracking-header">
                {message && (
                    <div style={{
                        position: 'fixed',
                        top: '1rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#10b981',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        zIndex: 100,
                        fontWeight: '600'
                    }}>
                        {message}
                    </div>
                )}
                <div>
                    <Link to="/profile" className="back-link">
                        <ArrowLeft size={16} /> Back to Orders
                    </Link>
                    <div className="tracking-title-group" style={{ marginTop: '1rem' }}>
                        <h1>Order Tracking</h1>
                        <p className="tracking-subtitle">Order #{order.orderId}</p>
                    </div>
                </div>
            </header>

            {/* Horizontal Stepper - Mobile Only */}
            <div className="horizontal-stepper">
                <div className="stepper-track"></div>
                {TIMELINE_STEPS.map((step) => {
                    const state = getStepState(step.status);
                    const StepIcon = step.icon;

                    return (
                        <div key={step.status} className={`stepper-item ${state}`}>
                            <div className="stepper-icon-box">
                                {state === 'completed' ? (
                                    <CheckCircle size={20} />
                                ) : (
                                    <StepIcon size={18} />
                                )}
                            </div>
                            <span className="stepper-label">{step.label}</span>
                        </div>
                    );
                })}
            </div>

            {/* Main Content */}
            <div className="tracking-grid">

                {/* Left Column: Timeline & Items */}
                <div className="left-col">

                    {/* Timeline Card - Desktop Only */}
                    <div className="tracking-card">
                        <h2 className="card-title">Tracking Status</h2>
                        <div className="timeline">
                            <div className="timeline-track"></div>
                            {TIMELINE_STEPS.map((step) => {
                                const state = getStepState(step.status);
                                const StepIcon = step.icon;

                                return (
                                    <div key={step.status} className={`timeline-item ${state}`}>
                                        <div className="timeline-icon-box">
                                            {state === 'completed' ? (
                                                <CheckCircle size={20} />
                                            ) : (
                                                <StepIcon size={20} />
                                            )}
                                        </div>
                                        <div className="timeline-content">
                                            <h3>{step.label}</h3>
                                            <p>{step.description}</p>
                                            {state === 'completed' && (
                                                <span className="timeline-date">
                                                    {new Date(order.updatedAt).toLocaleDateString()} {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Distance Tracking Visualization */}
                    {distanceKm > 0 && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                        <div className="tracking-card distance-card" style={{ background: '#1f2937', color: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', margin: 0 }}>
                                    {['RETURN_APPROVED', 'PICKUP_SCHEDULED', 'RETURNED', 'EXCHANGE_APPROVED', 'EXCHANGED', 'OUT_FOR_PICKUP'].includes(order.status)
                                        ? 'Return Tracking'
                                        : 'Package Tracking'}
                                </h2>
                                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 500 }}>
                                    {distanceKm} km total
                                </span>
                            </div>

                            <div style={{ position: 'relative', padding: '0 10px', marginBottom: '2rem' }}>
                                {/* Track Line */}
                                <div style={{
                                    position: 'absolute',
                                    top: '20px',
                                    left: '40px',
                                    right: '40px',
                                    height: '6px',
                                    background: '#374151',
                                    borderRadius: '3px',
                                    zIndex: 0
                                }}>
                                    <div style={{
                                        width: ['RETURNED', 'EXCHANGED'].includes(order.status) ? '100%'
                                            : ['PICKUP_SCHEDULED', 'OUT_FOR_PICKUP'].includes(order.status) ? '65%'
                                                : ['RETURN_APPROVED', 'EXCHANGE_APPROVED'].includes(order.status) ? '30%'
                                                    : order.status === 'SHIPPED' ? '65%'
                                                        : order.status === 'PAID' ? '30%' : '5%',
                                        height: '100%',
                                        background: '#10b981',
                                        borderRadius: '3px',
                                        transition: 'width 1s ease',
                                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)'
                                    }}></div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                                    {(() => {
                                        const isReverse = ['RETURN_APPROVED', 'PICKUP_SCHEDULED', 'RETURNED', 'EXCHANGE_APPROVED', 'EXCHANGED', 'OUT_FOR_PICKUP'].includes(order.status);

                                        // Nodes configuration
                                        const startNode = isReverse ? {
                                            label: 'You',
                                            location: order.shippingAddress?.city,
                                            icon: Home
                                        } : {
                                            label: 'Seller',
                                            location: sellerCity || `Zip: ${order.sellerZipCode}`,
                                            icon: Package
                                        };

                                        const endNode = isReverse ? {
                                            label: 'Seller',
                                            location: sellerCity || `Zip: ${order.sellerZipCode}`,
                                            icon: Package
                                        } : {
                                            label: 'You',
                                            location: order.shippingAddress?.city,
                                            icon: Home
                                        };

                                        return (
                                            <>
                                                {/* Start Node */}
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80px' }}>
                                                    <div style={{
                                                        width: '40px', height: '40px',
                                                        background: '#374151',
                                                        borderRadius: '50%',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        border: '4px solid #1f2937',
                                                        marginBottom: '8px'
                                                    }}>
                                                        <startNode.icon size={18} color="#e5e7eb" />
                                                    </div>
                                                    <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af', lineHeight: '1.4' }}>
                                                        <span style={{ display: 'block', fontWeight: 600, color: '#e5e7eb' }}>{startNode.label}</span>
                                                        {startNode.location}
                                                    </div>
                                                </div>

                                                {/* End Node */}
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80px' }}>
                                                    <div style={{
                                                        width: '40px', height: '40px',
                                                        background: ['RETURNED', 'EXCHANGED', 'DELIVERED'].includes(order.status) ? '#10b981' : '#374151',
                                                        borderRadius: '50%',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        border: '4px solid #1f2937',
                                                        marginBottom: '8px'
                                                    }}>
                                                        <endNode.icon size={18} color={['RETURNED', 'EXCHANGED', 'DELIVERED'].includes(order.status) ? '#fff' : '#e5e7eb'} />
                                                    </div>
                                                    <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af', lineHeight: '1.4' }}>
                                                        <span style={{ display: 'block', fontWeight: 600, color: '#e5e7eb' }}>{endNode.label}</span>
                                                        {endNode.location}
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '12px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <Truck size={16} color="#9ca3af" />
                                <span style={{ fontSize: '0.85rem', color: '#d1d5db' }}>
                                    {['RETURN_APPROVED', 'PICKUP_SCHEDULED', 'RETURNED', 'EXCHANGE_APPROVED', 'EXCHANGED', 'OUT_FOR_PICKUP'].includes(order.status)
                                        ? `Return package travelling ${distanceKm} km back to seller.`
                                        : `Package travelling ${distanceKm} km to you.`}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Order Items Card */}
                    <div className="tracking-card">
                        <h2 className="card-title">Order Items</h2>
                        <div className="order-items-list">
                            {order.items.map((item: any) => {
                                const productId = item.product?._id || item.productId;

                                return (
                                    <Link
                                        key={item.productId}
                                        to={`/products/${productId}`}
                                        className="order-item"
                                        style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div className="item-image">
                                            {(() => {
                                                // Try multiple possible paths for the image
                                                const imageUrl = item.product?.images?.[0]?.url ||
                                                    item.images?.[0]?.url ||
                                                    item.image ||
                                                    null;

                                                return imageUrl ? (
                                                    <img src={imageUrl} alt={item.product?.title || item.title} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Package size={24} color="#9ca3af" />
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div className="item-details">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <h4 className="item-name">{item.product?.title || item.title}</h4>
                                                    <p className="item-meta">Qty: {item.quantity}</p>
                                                </div>
                                                <span className="item-price">₹{item.price / 100}</span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="order-summary">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{order.total / 100}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                <span style={{ color: '#16a34a', fontWeight: 600 }}>FREE</span>
                            </div>
                            <div className="summary-row summary-total">
                                <span>Total Paid</span>
                                <span>₹{order.total / 100}</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Info Cards */}
                <div className="right-col">

                    {/* Delivery Estimate */}
                    <div className="tracking-card">
                        <div className="info-card-content">
                            <Calendar className="info-icon" size={24} />
                            <div className="info-text">
                                <h4>Estimated Delivery</h4>
                                <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.25rem 0 0.5rem 0', color: '#111827' }}>
                                    {estimatedDelivery.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                                <p className="info-subtext">We'll notify you when it's out for delivery</p>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="tracking-card">
                        <div className="info-card-content">
                            <MapPin className="info-icon" size={24} />
                            <div className="info-text">
                                <h4>Shipping Address</h4>
                                <p style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
                                    {userName}
                                </p>
                                <p style={{ lineHeight: '1.6', color: '#4b5563' }}>
                                    {order.shippingAddress?.street}<br />
                                    {order.shippingAddress?.city}, {order.shippingAddress?.state}<br />
                                    {order.shippingAddress?.zipCode}
                                </p>
                                <p style={{ marginTop: '0.5rem', fontWeight: 500, color: '#374151' }}>
                                    {(user as any)?.mobile || (user as any)?.phone}
                                </p>
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span style={{ color: '#6b7280' }}>Order Number</span>
                            <span style={{ fontWeight: 600, color: '#111827' }}>#{order.orderId}</span>
                        </div>
                    </div>

                    {/* Need Help? */}
                    <div className="tracking-card">
                        <div className="info-card-content">
                            <div className="info-text">
                                <h4>Need Help?</h4>
                                {order.status === 'DELIVERED' ? (
                                    <>
                                        <p>Need to return or exchange? You can request it here.</p>
                                        <div className="help-links">
                                            <button
                                                onClick={() => setShowReturnModal(true)}
                                                className="help-link-btn"
                                            >
                                                Return Item
                                            </button>
                                            <span className="divider-dot">•</span>
                                            <button
                                                onClick={() => setShowExchangeModal(true)}
                                                className="help-link-btn"
                                            >
                                                Exchange Item
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <p>
                                        Questions about your order? We are here to help.
                                    </p>
                                )}
                                <div className="help-links">
                                    <Link to="/profile?tab=help" className="help-link-btn">Contact Support</Link>
                                    <span className="divider-dot">•</span>
                                    <Link to="/profile?tab=help" className="help-link-btn">Return Policy</Link>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Modals */}
            <ReasonModal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} onSubmit={async (reason) => {
                const token = localStorage.getItem('token');
                if (!token) return;
                const updated = await OrderApi.requestReturn(orderId!, reason, token);
                setOrder(updated);
                setMessage('Return requested');
            }} title="Request Return" placeholder="Reason..." type="return" />

            <ReasonModal isOpen={showExchangeModal} onClose={() => setShowExchangeModal(false)} onSubmit={async (reason) => {
                const token = localStorage.getItem('token');
                if (!token) return;
                const updated = await OrderApi.requestExchange(orderId!, reason, token);
                setOrder(updated);
                setMessage('Exchange requested');
            }} title="Request Exchange" placeholder="Reason..." type="exchange" />
        </div>
    );
}
