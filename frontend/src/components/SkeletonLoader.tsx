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
                    <Skeleton height="300px" style={{ borderRadius: '12px' }} />
                    <div style={{ padding: '0.5rem 0' }}>
                        <Skeleton width="40%" height="0.8rem" style={{ marginBottom: '0.5rem' }} />
                        <Skeleton width="80%" height="1.2rem" style={{ marginBottom: '0.5rem' }} />
                        <Skeleton width="30%" height="1rem" />
                    </div>
                </div>
            ))}
        </div>
    );
};

// 2. Product Details Skeleton (for ProductDetails.tsx)
export const ProductDetailsSkeleton = () => {
    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <div className="skeleton-details-grid">
                {/* Left: Images */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Skeleton height="500px" style={{ borderRadius: '12px' }} />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Skeleton height="80px" width="80px" style={{ borderRadius: '8px' }} />
                        <Skeleton height="80px" width="80px" style={{ borderRadius: '8px' }} />
                        <Skeleton height="80px" width="80px" style={{ borderRadius: '8px' }} />
                    </div>
                </div>

                {/* Right: Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Skeleton width="30%" height="1rem" />
                    <Skeleton width="80%" height="3rem" />
                    <Skeleton width="40%" height="2rem" />

                    <div style={{ marginTop: '2rem' }}>
                        <Skeleton height="1rem" style={{ marginBottom: '0.5rem' }} />
                        <Skeleton height="1rem" style={{ marginBottom: '0.5rem' }} />
                        <Skeleton width="90%" height="1rem" />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <Skeleton width="150px" height="50px" style={{ borderRadius: '99px' }} />
                        <Skeleton width="150px" height="50px" style={{ borderRadius: '99px' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3. Table Skeleton (for Admin & Orders)
export const TableSkeleton = () => {
    return (
        <div style={{ width: '100%', background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <Skeleton width="150px" height="2rem" />
                <Skeleton width="100px" height="2rem" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #eee', padding: '1rem 0' }}>
                    <Skeleton width="20%" height="1.5rem" />
                    <Skeleton width="30%" height="1.5rem" />
                    <Skeleton width="20%" height="1.5rem" />
                    <Skeleton width="10%" height="1.5rem" />
                </div>
            ))}
        </div>
    );
};

// 4. Profile/Dashboard Skeleton
export const DashboardSkeleton = () => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} height="120px" style={{ borderRadius: '12px' }} />
            ))}
        </div>
    );
};

// 5. Cart Skeleton
export const CartSkeleton = () => {
    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', background: '#F9F9F9', borderRadius: '12px' }}>
                            <Skeleton width="100px" height="120px" style={{ borderRadius: '8px' }} />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <Skeleton width="40%" height="1.2rem" />
                                <Skeleton width="20%" height="1rem" />
                                <div style={{ marginTop: 'auto' }}>
                                    <Skeleton width="80px" height="2rem" style={{ borderRadius: '8px' }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div>
                    <Skeleton height="300px" style={{ borderRadius: '16px' }} />
                </div>
            </div>
        </div>
    );
};