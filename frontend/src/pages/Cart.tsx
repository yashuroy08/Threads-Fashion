
import { useNavigate, Link } from 'react-router-dom';
import { useCartContext } from '../context/CartContext';
import { CartSkeleton } from '../components/SkeletonLoader';
import {
    Trash2,
    Heart,
    ChevronDown,
    X,
    AlertCircle
} from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useNotification } from '../context/NotificationContext';
import Breadcrumb from '../components/Breadcrumb';
import '../styles/cart.css';
import { useState } from 'react';

export default function Cart() {
    const { cart, loading, updateQuantity, removeItem, addToCart } = useCartContext();
    const { notify } = useNotification();
    const { addToWishlist } = useWishlist();
    const navigate = useNavigate();
    const [deleteConfirm, setDeleteConfirm] = useState<{
        show: boolean;
        productId?: string;
        productTitle?: string;
        size?: string;
        color?: string;
    }>({ show: false });


    if (loading) return <CartSkeleton />;

    // Calculate subtotal from items if cart.total is 0 but items exist (fallback)
    const calculatedSubtotal = cart?.items?.reduce((sum: number, item: any) => {
        return sum + (item.productId?.price?.amount || 0) * item.quantity;
    }, 0) || 0;

    const subtotal = (cart?.total && cart.total > 0) ? cart.total : calculatedSubtotal;
    const tax = Math.round(subtotal * 0.05);
    const finalTotal = subtotal + tax;

    const handleDeleteClick = (productId: string, productTitle: string, size: string, color: string) => {
        setDeleteConfirm({ show: true, productId, productTitle, size, color });
    };

    const confirmDelete = () => {
        if (deleteConfirm.productId) {
            removeItem(deleteConfirm.productId, deleteConfirm.size || '', deleteConfirm.color || '');
        }
        setDeleteConfirm({ show: false });
    };

    const cancelDelete = () => {
        setDeleteConfirm({ show: false });
    };

    if (!cart || cart.items.length === 0) {
        return (
            <div className="empty-cart-container">
                <div style={{ background: '#f9fafb', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                    <Trash2 size={48} color="#9ca3af" />
                </div>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: '700', color: '#111827' }}>Your Cart is Empty</h2>
                <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1.1rem' }}>
                    Looks like you haven't added anything to your cart yet.
                </p>
                <Link
                    to="/products"
                    className="btn-checkout"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        textDecoration: 'none',
                        width: 'auto',
                        padding: '1rem 2rem'
                    }}
                >
                    Start Shopping
                </Link>
            </div>
        );
    }
    return (
        <div className="cart-page-wrapper">
            {/* Custom Header */}
            <div className="cart-header-bar">
                <div className="cart-header-content">
                    <Link to="/" className="cart-brand">
                        THREADS
                        <span>
                            <div className="cart-brand-line">.</div>
                        </span>
                    </Link>
                    <Link to="/products" className="header-continue-shopping mobile-only">
                        Continue Shopping
                    </Link>
                </div>
            </div>

            <div className="cart-desktop-breadcrumb-bar desktop-only">
                <Breadcrumb items={[{ label: 'Shopping Bag' }]} />
            </div>

            <div className="cart-container">

                <div className="cart-title-section">
                    <div className="cart-titles">
                        <h1 className="cart-title">Shopping Cart</h1>
                        <p className="cart-subtitle">{cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}</p>
                    </div>
                </div>

                <div className="cart-grid">
                    {/* Left Column: Items */}
                    <div className="cart-items-list">
                        {cart.items.map((item: any) => {
                            const product = item.productId;
                            return (
                                <div key={`${product._id}-${item.size}-${item.color}`} className="cart-item-card">
                                    {/* Product Image */}
                                    <div className="cart-item-image">
                                        {product.images && product.images[0] ? (
                                            <img src={product.images[0].url} alt={product.title} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No Image</div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="cart-item-info">
                                        <div className="cart-item-header">
                                            <h3 className="cart-item-title">
                                                {product.title}
                                            </h3>
                                            <div className="cart-item-actions">
                                                <button
                                                    onClick={() => handleDeleteClick(product._id, product.title, item.size, item.color)}
                                                    className="btn-icon-action delete"
                                                    title="Remove Item"
                                                >
                                                    <Trash2 size={24} color="#ef4444" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Variant Display & Quantity with Dropdowns */}
                                        <div className="cart-item-controls-row">
                                            {item.size && (
                                                <div className="control-group">
                                                    <label className="control-label">Size</label>
                                                    <div className="control-select-wrapper">
                                                        <select
                                                            value={item.size}
                                                            onChange={async (e) => {
                                                                const newSize = e.target.value;
                                                                if (newSize === item.size) return;

                                                                // Check stock
                                                                let valid = true;
                                                                if (product.variants?.length) {
                                                                    const v = product.variants.find((v: any) => v.size === newSize && v.color === item.color);
                                                                    const available = (v?.stock || 0) - (v?.reservedStock || 0);
                                                                    if (!v || available < 1) valid = false;
                                                                } else {
                                                                    const available = (product.stock || 0) - (product.reservedStock || 0);
                                                                    if (available < 1) valid = false;
                                                                }

                                                                if (!valid) {
                                                                    notify('Selected size is out of stock', 'error');
                                                                    return;
                                                                }

                                                                try {
                                                                    await removeItem(product._id, item.size, item.color);
                                                                    await addToCart(product._id, item.quantity, newSize, item.color, false);
                                                                } catch (err: any) {
                                                                    console.error("Failed to change size", err);
                                                                    const msg = err?.response?.data?.message || err?.message || "Failed to update size";
                                                                    notify(String(msg), "error");
                                                                }
                                                            }}
                                                            className="control-select"
                                                        >
                                                            {product.sizes && product.sizes.length > 0 ? (
                                                                product.sizes.map((s: string) => (
                                                                    <option key={s} value={s}>{s}</option>
                                                                ))
                                                            ) : (
                                                                <option value={item.size}>{item.size}</option>
                                                            )}
                                                        </select>
                                                        <span className="select-chevron">
                                                            <ChevronDown size={14} />
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Qty Selector */}
                                            <div className="control-group">
                                                <label className="control-label">Qty</label>
                                                <div className="control-select-wrapper">
                                                    <select
                                                        value={item.quantity}
                                                        onChange={async (e) => {
                                                            const newQty = Number(e.target.value);
                                                            try {
                                                                await updateQuantity(product._id, newQty, item.size, item.color);
                                                            } catch (err: any) {
                                                                const msg = err?.response?.data?.message || err?.message || "Failed to update quantity";
                                                                notify(String(msg), "error");
                                                            }
                                                        }}
                                                        className="control-select"
                                                    >
                                                        {(() => {
                                                            let max = 10;
                                                            if (product.variants?.length) {
                                                                const v = product.variants.find((v: any) => v.size === item.size && v.color === item.color);
                                                                if (v) {
                                                                    // Compute available stock safely
                                                                    const stock = Number(v.stock) || 0;
                                                                    const reserved = Number(v.reservedStock) || 0;
                                                                    max = Math.max(0, stock - reserved);
                                                                }
                                                            } else if (product.stock !== undefined) {
                                                                const stock = Number(product.stock) || 0;
                                                                const reserved = Number(product.reservedStock) || 0;
                                                                max = Math.max(0, stock - reserved);
                                                            }

                                                            const safeQty = Number(item.quantity) || 1;
                                                            // Limit logic: at least current qty, up to min(10, max)
                                                            const limit = Math.max(1, Math.floor(Math.max(safeQty, Math.min(10, max))));

                                                            return [...Array(limit)].map((_, i) => (
                                                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                                                            ));
                                                        })()}
                                                    </select>
                                                    <span className="select-chevron">
                                                        <ChevronDown size={14} />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price & Wishlist Row */}
                                        <div className="cart-item-footer">
                                            <div className="cart-item-price">
                                                ₹{(product.price.amount / 100).toLocaleString('en-IN')}
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await addToWishlist(product._id);
                                                        await removeItem(product._id, item.size, item.color);
                                                        notify('Moved to wishlist', 'success');
                                                    } catch (err: any) {
                                                        console.error('Failed to move to wishlist:', err);
                                                        notify('Failed to move to wishlist', 'error');
                                                    }
                                                }}
                                                className="btn-icon-action wishlist"
                                                title="Move to Wishlist"
                                            >
                                                <Heart size={22} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="cart-summary-card">
                        <h2 className="summary-title">Order Summary</h2>

                        <div className="summary-details">
                            <div className="summary-row-bold">
                                <span>Subtotal:</span>
                                <span>₹{(subtotal / 100).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="summary-row-bold">
                                <span>Shipping:</span>
                                <span style={{ color: '#16a34a' }}>FREE</span>
                            </div>
                            <div className="summary-row-bold">
                                <span>Tax:</span>
                                <span>₹{(tax / 100).toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-total-row-bold">
                            <span className="summary-total-label">Grand Total:</span>
                            <span className="summary-total-value">₹{(finalTotal / 100).toLocaleString('en-IN')}</span>
                        </div>

                        <button
                            onClick={() => navigate('/checkout')}
                            className="btn-checkout"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Bar for Mobile Only */}
            <div className="mobile-checkout-bar">
                <button
                    onClick={() => navigate('/checkout')}
                    className="btn-checkout-mobile"
                >
                    <span className="btn-label">Checkout</span>
                    <span className="btn-price">₹{(finalTotal / 100).toLocaleString('en-IN')}</span>
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '20px',
                        padding: '2rem',
                        maxWidth: '450px',
                        width: '100%',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                        position: 'relative'
                    }}>
                        <button
                            onClick={cancelDelete}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#9ca3af',
                                padding: '4px'
                            }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: '#fef2f2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem'
                            }}>
                                <AlertCircle size={32} color="#ef4444" />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
                                Remove from Cart?
                            </h3>
                            <p style={{ fontSize: '0.95rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                Are you sure you want to remove
                            </p>
                            <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                                "{deleteConfirm.productTitle}"
                            </p>
                            <div style={{
                                background: '#f0f7ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '12px',
                                padding: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <Heart size={20} color="#2563eb" />
                                <p style={{ fontSize: '0.9rem', color: '#1e40af', margin: 0, textAlign: 'left' }}>
                                    <strong>Tip:</strong> You can move it to wishlist to save it for later!
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={cancelDelete}
                                style={{
                                    flex: 1,
                                    padding: '0.875rem 1.5rem',
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    flex: 1,
                                    padding: '0.875rem 1.5rem',
                                    background: '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}
