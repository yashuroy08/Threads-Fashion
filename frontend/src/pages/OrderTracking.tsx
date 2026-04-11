import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuthContext } from '../context/AuthContext';
import ReasonModal from '../components/ReasonModal';
import { OrderApi } from '../api/orders.api';
import { API_BASE } from '../config/api.config';
import {
    CheckCircle,
    Package,
    Truck,
    Home,
    MapPin,
    Calendar,
    ArrowLeft,
    ShieldCheck,
    XCircle,
    RefreshCw,
    Search,
    ShoppingBag,
    HelpCircle,
    RotateCcw
} from 'lucide-react';
import { useCartContext } from '../context/CartContext';
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
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [sellerCity, setSellerCity] = useState<string>('');
    const socket = useSocket();
    const { addToCart } = useCartContext();

    const fetchOrder = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setOrder(data);
            } else {
                setOrder(null);
                console.error('Failed to fetch order:', data);
            }
        } catch (error) {
            console.error(error);
            setOrder(null);
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

    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Guest User';

    const normalizedStatus = (order.status || 'PENDING').trim().toUpperCase();
    
    // Status Logic for visibility
    const canCancel = ['PENDING', 'PLACED', 'PAID', 'CONFIRMED', 'PROCESSING'].includes(normalizedStatus);
    const canReturn = normalizedStatus === 'DELIVERED';
    const canExchange = normalizedStatus === 'DELIVERED';
    const isReturning = ['RETURN_REQUESTED', 'RETURN_APPROVED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'RETURNED', 'REFUND_INITIATED', 'REFUNDED'].includes(normalizedStatus);
    const isExchanging = ['EXCHANGE_REQUESTED', 'EXCHANGE_APPROVED', 'EXCHANGE_SHIPPED', 'EXCHANGED'].includes(normalizedStatus);
    const isCancelled = normalizedStatus === 'CANCELLED';
    const isShipped = normalizedStatus === 'SHIPPED';
    const isDelivered = normalizedStatus === 'DELIVERED';
    const isProcessing = ['PAID', 'CONFIRMED', 'PROCESSING'].includes(normalizedStatus);

    const statusOrderMap: { [key: string]: number } = {
        'PENDING': 0, 'PLACED': 0,
        'PAID': 1, 'CONFIRMED': 1, 'PROCESSING': 1,
        'SHIPPED': 2,
        'DELIVERED': 3,
        'RETURN_REQUESTED': 4,
        'RETURN_APPROVED': 5,
        'PICKUP_SCHEDULED': 6,
        'OUT_FOR_PICKUP': 6,
        'PICKED_UP': 7,
        'RETURNED': 8,
        'REFUND_INITIATED': 9,
        'REFUNDED': 10,
        'EXCHANGE_REQUESTED': 4,
        'EXCHANGE_APPROVED': 5,
        'EXCHANGE_SHIPPED': 6,
        'EXCHANGED': 7
    };

    const handleOrderAction = async (type: 'CANCEL' | 'RETURN' | 'EXCHANGE', reason: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            setActionLoading(true);
            let updated;
            if (type === 'CANCEL') {
                updated = await OrderApi.cancelOrder(orderId!, reason, token);
                setMessage('Order cancelled successfully');
            } else if (type === 'RETURN') {
                updated = await OrderApi.requestReturn(orderId!, reason, token);
                setMessage('Return request submitted');
            } else {
                updated = await OrderApi.requestExchange(orderId!, reason, token);
                setMessage('Exchange request submitted');
            }
            
            setOrder(updated);
            setShowCancelModal(false);
            setShowReturnModal(false);
            setShowExchangeModal(false);
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            console.error(error);
            setMessage(error.message || 'Action failed');
            setTimeout(() => setMessage(null), 3000);
        } finally {
            setActionLoading(false);
        }
    };

    const estimatedDelivery = order.estimatedDeliveryDate
        ? new Date(order.estimatedDeliveryDate)
        : new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000);

    const distanceKm = order.distanceKm || 0;

    const handleBuyAgain = async () => {
        if (!order || !order.items) return;
        
        setActionLoading(true);
        let allSuccess = true;
        
        for (const item of order.items) {
            const productId = item.product?._id || item.productId;
            const success = await addToCart(productId, 1, item.size, item.color, false);
            if (!success) allSuccess = false;
        }

        if (allSuccess) {
            setMessage('Items added to cart!');
        } else {
            setMessage('Some items could not be added (out of stock)');
        }
        
        setActionLoading(false);
        setTimeout(() => setMessage(null), 3000);
    };

    const getCurrentTimelineSteps = () => {
        const steps = [...TIMELINE_STEPS];
        
        if (isReturning) {
            steps.push(
                { status: 'RETURN_REQUESTED', label: 'Return Initiated', description: 'Return request submitted', icon: RotateCcw },
                { status: 'RETURN_APPROVED', label: 'Return Picked', description: 'Item picked by agent', icon: Truck },
                { status: 'REFUNDED', label: 'Refunded', description: 'Refund processed to source', icon: ShieldCheck }
            );
        } else if (isExchanging) {
            steps.push(
                { status: 'EXCHANGE_REQUESTED', label: 'Exchange Initiated', description: 'Replacement requested', icon: RefreshCw },
                { status: 'EXCHANGE_APPROVED', label: 'Exchange Shipped', description: 'Replacement on way', icon: Truck },
                { status: 'EXCHANGED', label: 'Exchange Done', description: 'Replacement delivered', icon: CheckCircle }
            );
        } else if (isCancelled) {
            steps.push(
                { status: 'CANCELLED', label: 'Cancelled', description: 'Order has been cancelled', icon: XCircle }
            );
        }
        
        return steps;
    };

    const currentTimelineSteps = getCurrentTimelineSteps();

    const getStepState = (stepStatus: string) => {
        const currentScore = statusOrderMap[normalizedStatus] ?? -1;
        const stepScore = statusOrderMap[stepStatus] ?? -1;

        if (isCancelled) {
            if (stepStatus === 'CANCELLED') return 'completed';
            // Mark previous steps as completed if they happened before cancellation
            return (stepScore !== -1 && stepScore < currentScore) ? 'completed' : 'inactive';
        }
        
        if (currentScore === -1 || stepScore === -1) return 'inactive';
        if (stepScore < currentScore) return 'completed';
        if (stepScore === currentScore) return 'current';
        return 'inactive';
    };

    const getStatusTheme = () => {
        if (isCancelled) return { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled' };
        if (isReturning) {
            let label = 'Return In Progress';
            if (normalizedStatus === 'RETURN_REQUESTED') label = 'Return Requested';
            if (normalizedStatus === 'RETURN_APPROVED') label = 'Return Approved';
            if (normalizedStatus === 'PICKUP_SCHEDULED') label = 'Pickup Scheduled';
            if (normalizedStatus === 'OUT_FOR_PICKUP') label = 'Out for Pickup';
            if (normalizedStatus === 'PICKED_UP') label = 'Picked Up';
            if (normalizedStatus === 'RETURNED') label = 'Returned';
            if (normalizedStatus === 'REFUND_INITIATED') label = 'Refund Initiated';
            if (normalizedStatus === 'REFUNDED') label = 'Refunded';
            
            return { bg: '#fef3c7', color: '#d97706', label };
        }
        if (isExchanging) {
            let label = 'Exchange In Progress';
            if (normalizedStatus === 'EXCHANGE_REQUESTED') label = 'Exchange Requested';
            if (normalizedStatus === 'EXCHANGE_APPROVED') label = 'Exchange Approved';
            if (normalizedStatus === 'EXCHANGE_SHIPPED') label = 'Exchange Shipped';
            if (normalizedStatus === 'EXCHANGED') label = 'Exchanged';
            
            return { bg: '#e0f2fe', color: '#0284c7', label };
        }
        if (isDelivered) return { bg: '#dcfce7', color: '#16a34a', label: 'Delivered' };
        if (isShipped) return { bg: '#f3e8ff', color: '#9333ea', label: 'In Transit' };
        if (isProcessing) return { bg: '#dbeafe', color: '#1e40af', label: 'Processing' };
        return { bg: '#f3f4f6', color: '#4b5563', label: normalizedStatus.replace(/_/g, ' ') };
    };

    const statusTheme = getStatusTheme();

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
                    <div className="tracking-title-group" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1>Order Tracking</h1>
                            <p className="tracking-subtitle">Order #{order.orderId}</p>
                        </div>
                        <div style={{
                            background: statusTheme.bg,
                            color: statusTheme.color,
                            padding: '8px 16px',
                            borderRadius: '30px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusTheme.color }}></div>
                            {statusTheme.label}
                        </div>
                    </div>
                </div>
            </header>

            {/* Status-specific Action Banner */}
            {(isDelivered || isReturning || isExchanging) && (
                <div className="status-action-banner" style={{
                    background: isReturning ? '#fffbeb' : isExchanging ? '#f0f9ff' : '#f0fdf4',
                    border: `1px solid ${isReturning ? '#fde68a' : isExchanging ? '#bae6fd' : '#bbf7d0'}`,
                    borderRadius: '12px',
                    padding: '1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: isReturning ? '#fef3c7' : isExchanging ? '#e0f2fe' : '#dcfce7', padding: '10px', borderRadius: '50%' }}>
                            {isReturning ? <RotateCcw size={24} color="#d97706" /> : isExchanging ? <RefreshCw size={24} color="#0284c7" /> : <CheckCircle size={24} color="#16a34a" />}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', color: isReturning ? '#92400e' : isExchanging ? '#075985' : '#166534' }}>
                                {isReturning ? 'Return in Progress' : isExchanging ? 'Exchange in Progress' : 'Order Delivered'}
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: isReturning ? '#b45309' : isExchanging ? '#0369a1' : '#15803d' }}>
                                {isReturning ? 'We are processing your return request.' : isExchanging ? 'We are working on your exchange request.' : `Not satisfied? Return or exchange until ${(new Date(new Date(order.updatedAt).getTime() + 7 * 24 * 60 * 60 * 1000)).toLocaleDateString()}`}
                            </p>
                        </div>
                    </div>
                    {isDelivered && !isReturning && !isExchanging && (
                        <div className="banner-actions-grid">
                            <button className="action-button-pill warning" onClick={() => setShowReturnModal(true)}>
                                <RotateCcw size={16} /> Return Items
                            </button>
                            <button className="action-button-pill info" onClick={() => setShowExchangeModal(true)}>
                                <RefreshCw size={16} /> Exchange Items
                            </button>
                            <button className="action-button-pill dark" onClick={handleBuyAgain} disabled={actionLoading}>
                                <ShoppingBag size={16} /> {actionLoading ? 'Adding...' : 'Buy Again'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {isCancelled && (
                <div className="status-action-banner" style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{ background: '#fee2e2', padding: '10px', borderRadius: '50%' }}>
                        <XCircle size={24} color="#dc2626" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', color: '#991b1b' }}>Order Cancelled</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#b91c1c', marginBottom: '10px' }}>This order was cancelled. Refund will be processed if payment was made.</p>
                        <button className="action-button-pill dark" onClick={handleBuyAgain} disabled={actionLoading}>
                            <ShoppingBag size={16} /> {actionLoading ? 'Adding...' : 'Buy Again'}
                        </button>
                    </div>
                </div>
            )}

            {/* Horizontal Stepper - Mobile Only */}
            <div className="horizontal-stepper">
                <div className="stepper-track"></div>
                {currentTimelineSteps.map((step) => {
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
                            {currentTimelineSteps.map((step) => {
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
                    {normalizedStatus !== 'CANCELLED' && normalizedStatus !== 'DELIVERED' && (
                        <div className="tracking-card distance-card" style={{ background: '#1f2937', color: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', margin: 0 }}>
                                    {['RETURN_APPROVED', 'PICKUP_SCHEDULED', 'RETURNED', 'EXCHANGE_APPROVED', 'EXCHANGED', 'OUT_FOR_PICKUP'].includes(normalizedStatus)
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
                                        width: ['RETURNED', 'EXCHANGED'].includes(normalizedStatus) ? '100%'
                                            : ['PICKUP_SCHEDULED', 'OUT_FOR_PICKUP'].includes(normalizedStatus) ? '65%'
                                                : ['RETURN_APPROVED', 'EXCHANGE_APPROVED'].includes(normalizedStatus) ? '30%'
                                                    : normalizedStatus === 'SHIPPED' ? '65%'
                                                        : normalizedStatus === 'PAID' ? '30%' : '5%',
                                        height: '100%',
                                        background: '#10b981',
                                        borderRadius: '3px',
                                        transition: 'width 1s ease',
                                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)'
                                    }}></div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                                    {(() => {
                                        const isReverse = ['RETURN_APPROVED', 'PICKUP_SCHEDULED', 'RETURNED', 'EXCHANGE_APPROVED', 'EXCHANGED', 'OUT_FOR_PICKUP'].includes(normalizedStatus);

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
                                                        background: ['RETURNED', 'EXCHANGED', 'DELIVERED'].includes(normalizedStatus) ? '#10b981' : '#374151',
                                                        borderRadius: '50%',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        border: '4px solid #1f2937',
                                                        marginBottom: '8px'
                                                    }}>
                                                        <endNode.icon size={18} color={['RETURNED', 'EXCHANGED', 'DELIVERED'].includes(normalizedStatus) ? '#fff' : '#e5e7eb'} />
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
                                    {['RETURN_APPROVED', 'PICKUP_SCHEDULED', 'RETURNED', 'EXCHANGE_APPROVED', 'EXCHANGED', 'OUT_FOR_PICKUP'].includes(normalizedStatus)
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
                                                const imageUrl = item.image ||
                                                    item.product?.images?.[0]?.url ||
                                                    item.images?.[0]?.url ||
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

                    {/* Order Actions */}
                    <div className="tracking-card">
                        <div className="info-card-content">
                            <div className="info-text" style={{ width: '100%' }}>
                                <h4 style={{ marginBottom: '1rem' }}>Order Actions</h4>
                                
                                {isShipped && (
                                    <div style={{
                                        background: '#f8fafc',
                                        border: '1px dashed #cbd5e1',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        marginBottom: '1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <ShieldCheck size={20} color="#0f172a" />
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Delivery Verification Code</p>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '0.1em' }}>
                                                {order.deliveryOtp || '4029'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {canCancel && (
                                        <button 
                                            onClick={() => setShowCancelModal(true)}
                                            style={{ 
                                                width: '100%', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                gap: '8px',
                                                padding: '0.85rem',
                                                borderRadius: '10px',
                                                background: '#fee2e2',
                                                color: '#dc2626',
                                                border: '1px solid #fecaca',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <XCircle size={18} /> Cancel Order
                                        </button>
                                    )}

                                    {(isDelivered && !isReturning && !isExchanging) ? (
                                        <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '10px', textAlign: 'center' }}>
                                            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 10px 0' }}>Order actions available in banner above</p>
                                        </div>
                                    ) : null}
                                </div>

                                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                    <Link to="/profile?tab=help" style={{ fontSize: '0.85rem', color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <HelpCircle size={14} /> Need Help?
                                    </Link>
                                    <Link to="/profile?tab=help" style={{ fontSize: '0.85rem', color: '#6b7280', textDecoration: 'none' }}>Return Policy</Link>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Modals */}
            <ReasonModal 
                isOpen={showCancelModal} 
                onClose={() => setShowCancelModal(false)} 
                onSubmit={(reason) => handleOrderAction('CANCEL', reason)} 
                title="Cancel Order" 
                placeholder="Please tell us why you're cancelling..." 
                type="cancel"
                isLoading={actionLoading}
            />
            <ReasonModal 
                isOpen={showReturnModal} 
                onClose={() => setShowReturnModal(false)} 
                onSubmit={(reason) => handleOrderAction('RETURN', reason)} 
                title="Return Order" 
                placeholder="Describe the issue with the items..." 
                type="return"
                isLoading={actionLoading}
            />
            <ReasonModal 
                isOpen={showExchangeModal} 
                onClose={() => setShowExchangeModal(false)} 
                onSubmit={(reason) => handleOrderAction('EXCHANGE', reason)} 
                title="Exchange Order" 
                placeholder="Describe why you want an exchange..." 
                type="exchange"
                isLoading={actionLoading}
            />
        </div>
    );
}
