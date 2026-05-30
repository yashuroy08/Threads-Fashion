import '../styles/skeleton.css';

// Basic Atom
export const Skeleton = ({ height, width, style, className = '' }: { height?: string | number, width?: string | number, style?: React.CSSProperties, className?: string }) => (
    <div
        className={`skeleton ${className}`}
        style={{ height, width, ...style }}
    />
);

// 1. Product Grid Skeleton (for Products.tsx)
export const ProductGridSkeleton = () => {
    return (
        <div className="skeleton-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="skeleton-product-card">
                    <div className="skeleton-product-img-wrap">
                         <Skeleton height="100%" width="100%" />
                    </div>
                    <div className="skeleton-product-info">
                        <div className="skeleton-product-row">
                            <Skeleton width="60%" height="1.1rem" />
                            <Skeleton width="20%" height="1.1rem" />
                        </div>
                        <Skeleton width="40%" height="0.8rem" className="skeleton-product-subtitle" />
                    </div>
                </div>
            ))}
        </div>
    );
};

// 2. Product Details Skeleton (for ProductDetails.tsx)
export const ProductDetailsSkeleton = () => {
    return (
        <div className="skeleton-details-container">
            <div className="skeleton-details-grid">
                {/* Left: Images */}
                <div className="skeleton-gallery">
                    <div className="skeleton-thumbs">
                        <Skeleton height="106px" width="100%" />
                        <Skeleton height="106px" width="100%" />
                        <Skeleton height="106px" width="100%" />
                    </div>
                    <Skeleton className="skeleton-main-img" width="100%" />
                </div>

                {/* Right: Info */}
                <div className="skeleton-details-info">
                    <Skeleton width="30%" height="1rem" />
                    <Skeleton width="80%" height="3rem" />
                    <Skeleton width="20%" height="1.5rem" />

                    <div className="skeleton-details-desc">
                        <Skeleton height="1rem" width="90%" className="skeleton-details-desc-line" />
                        <Skeleton height="1rem" width="80%" className="skeleton-details-desc-line" />
                        <Skeleton width="60%" height="1rem" />
                    </div>
                    
                    {/* Sizes mock */}
                    <div className="skeleton-details-sizes">
                        <Skeleton height="40px" width="40px" />
                        <Skeleton height="40px" width="40px" />
                        <Skeleton height="40px" width="40px" />
                        <Skeleton height="40px" width="40px" />
                    </div>

                    <div className="skeleton-details-actions">
                        <Skeleton width="100%" height="56px" />
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3. Table Skeleton (for Admin & Orders)
export const TableSkeleton = () => {
    return (
        <div className="skeleton-table-container">
            <div className="skeleton-table-header">
                <Skeleton width="150px" height="2rem" />
                <Skeleton width="100px" height="2rem" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton-table-row">
                    <Skeleton width="20%" height="1.2rem" />
                    <Skeleton width="30%" height="1.2rem" />
                    <Skeleton width="20%" height="1.2rem" />
                    <Skeleton width="10%" height="1.2rem" />
                </div>
            ))}
        </div>
    );
};

// 4. Profile/Dashboard Skeleton
export const DashboardSkeleton = () => {
    return (
        <div className="skeleton-dashboard-grid">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton-dashboard-card">
                    <Skeleton height="1.2rem" width="40%" className="skeleton-dashboard-card-label" />
                    <Skeleton height="2rem" width="70%" />
                </div>
            ))}
        </div>
    );
};

// 5. Cart Skeleton
export const CartSkeleton = () => {
    return (
        <div className="skeleton-cart-container">
            <div className="skeleton-cart-grid">
                <div className="skeleton-cart-list">
                    <Skeleton width="200px" height="2.5rem" className="skeleton-cart-title" />
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton-cart-item">
                            <Skeleton className="skeleton-cart-img" />
                            <div className="skeleton-cart-info">
                                <Skeleton width="40%" height="1.2rem" />
                                <Skeleton width="20%" height="1rem" />
                                <div className="skeleton-cart-actions">
                                    <Skeleton width="80px" height="2.5rem" />
                                    <Skeleton width="80px" height="2.5rem" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// 6. Order Tracking Skeleton
export const OrderTrackingSkeleton = () => {
    return (
        <div className="skeleton-tracking-container">
            <div className="skeleton-tracking-wrap">
                <Skeleton width="40%" height="2rem" />
                <div className="skeleton-tracking-grid">
                    <div className="skeleton-tracking-main">
                        <Skeleton width="100%" height="8rem" style={{ borderRadius: '8px' }} />
                        <Skeleton width="100%" height="16rem" style={{ borderRadius: '8px' }} />
                    </div>
                    <div className="skeleton-tracking-side">
                        <Skeleton width="100%" height="12rem" style={{ borderRadius: '8px' }} />
                        <Skeleton width="100%" height="8rem" style={{ borderRadius: '8px' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// 7. Checkout Skeleton
export const CheckoutSkeleton = () => {
    return (
        <div className="skeleton-checkout-container">
            <div className="skeleton-checkout-grid">
                {/* Left Side (Forms) */}
                <div className="skeleton-checkout-left">
                    <Skeleton width="100%" height="16rem" style={{ borderRadius: '8px' }} />
                    <Skeleton width="100%" height="12rem" style={{ borderRadius: '8px' }} />
                </div>
                
                {/* Right Side (Order Summary) */}
                <div className="skeleton-checkout-right">
                    <Skeleton width="100%" height="24rem" style={{ borderRadius: '8px' }} />
                </div>
            </div>
        </div>
    );
};