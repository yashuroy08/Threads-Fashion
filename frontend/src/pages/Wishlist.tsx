import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCartContext } from '../context/CartContext';
import { Trash2, Heart, ArrowLeft, ArrowRight } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import SwipeableItem from '../components/SwipeableItem';
import '../styles/wishlist.css';

export default function Wishlist() {
    const { wishlist, removeFromWishlist, loading } = useWishlist();
    const { addToCart } = useCartContext();
    const navigate = useNavigate();

    const handleMoveToCart = (product: any) => {
        const hasVariants = (product.sizes && product.sizes.length > 0) || (product.colors && product.colors.length > 0);

        if (hasVariants) {
            navigate(`/products/${product.slug || product._id}`);
            return;
        }

        addToCart(product._id, 1);
        removeFromWishlist(product._id);
    };

    if (loading) {
        return (
            <div className="container wishlist-loading">
                <p>Loading wishlist...</p>
            </div>
        );
    }

    if (!wishlist || wishlist.length === 0) {
        return (
            <div className="container wishlist-empty">
                <div style={{ background: '#f9fafb', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem', display: 'inline-block' }}>
                    <Heart size={48} color="#9ca3af" />
                </div>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: '700', color: '#111827' }}>Your Wishlist is Empty</h2>
                <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1.1rem' }}>
                    Save items you love here for later.
                </p>
                <Link
                    to="/products"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        textDecoration: 'none',
                        background: '#111827',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '1rem'
                    }}
                >
                    <ArrowLeft size={20} /> Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="wishlist-page">
            {/* Breadcrumb - Desktop Only */}
            <div className="wishlist-breadcrumb-desktop">
                <Breadcrumb items={[{ label: 'My Wishlist', href: '/wishlist' }]} />
            </div>

            {/* Header */}
            <div className="wishlist-page-header">
                <Link to="/products" className="back-link">
                    <ArrowLeft size={18} /> Continue Shopping
                </Link>
                <h1>My Wishlist</h1>
                <p>{wishlist.length} items saved</p>
            </div>

            {/* List */}
            <div className="wishlist-list">
                {wishlist.map((item) => {
                    const product: any = item.product;
                    if (!product) return null;

                    const hasVariants = (product.sizes && product.sizes.length > 0) || (product.colors && product.colors.length > 0);

                    return (
                        <div key={product._id} className="wishlist-item-wrapper">
                            <SwipeableItem onDelete={() => removeFromWishlist(product._id)}>
                                <div className="wishlist-card">

                                    {/* Image Wrapper */}
                                    <div className="img-wrapper">
                                        <Link to={`/products/${product.slug || product._id}`}>
                                            {product.images && product.images[0] ? (
                                                <img
                                                    src={product.images[0].url}
                                                    alt={product.title}
                                                    className="wishlist-image-img"
                                                />
                                            ) : (
                                                <div style={{ padding: '2rem', color: '#ccc' }}>No Img</div>
                                            )}
                                        </Link>
                                        <button
                                            onClick={() => removeFromWishlist(product._id)}
                                            className="delete-icon-btn"
                                            title="Remove"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Info Wrapper */}
                                    <div className="info-wrapper">
                                        <p className="item-tag">PREMIUM COTTON</p>
                                        <h3 className="item-title">
                                            <Link to={`/products/${product.slug || product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                {product.title}
                                            </Link>
                                        </h3>
                                        <p className="item-price">
                                            ₹{(product.price.amount / 100).toLocaleString('en-IN')}
                                        </p>

                                        <button
                                            onClick={() => handleMoveToCart(product)}
                                            className="select-options-btn"
                                        >
                                            {hasVariants ? 'Select Options' : 'Move to Cart'} <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </SwipeableItem>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
