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
                <div key={i} className="skeleton-product-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ aspectRatio: '3 / 4', width: '100%', overflow: 'hidden' }}>
                         <Skeleton height="100%" width="100%" />
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Skeleton width="60%" height="1.1rem" />
                            <Skeleton width="20%" height="1.1rem" />
                        </div>
                        <Skeleton width="40%" height="0.8rem" style={{ marginTop: '0.5rem' }} />
                    </div>
                </div>
            ))}
        </div>
    );
};

// 2. Product Details Skeleton (for ProductDetails.tsx)
export const ProductDetailsSkeleton = () => {
    return (
        <div className="container" style={{ padding: '6rem 5%', maxWidth: '1400px' }}>
            <div className="skeleton-details-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.2fr) 1fr', gap: '4rem' }}>
                {/* Left: Images */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '80px', flexShrink: 0 }}>
                        <Skeleton height="106px" width="100%" />
                        <Skeleton height="106px" width="100%" />
                        <Skeleton height="106px" width="100%" />
                    </div>
                    <Skeleton height="700px" width="100%" style={{ flex: 1 }} />
                </div>

                {/* Right: Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '1rem' }}>
                    <Skeleton width="30%" height="1rem" />
                    <Skeleton width="80%" height="3rem" />
                    <Skeleton width="20%" height="1.5rem" />

                    <div style={{ marginTop: '2rem' }}>
                        <Skeleton height="1rem" width="90%" style={{ marginBottom: '0.5rem' }} />
                        <Skeleton height="1rem" width="80%" style={{ marginBottom: '0.5rem' }} />
                        <Skeleton width="60%" height="1rem" />
                    </div>
                    
                    {/* Sizes mock */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <Skeleton height="40px" width="40px" />
                        <Skeleton height="40px" width="40px" />
                        <Skeleton height="40px" width="40px" />
                        <Skeleton height="40px" width="40px" />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
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
        <div style={{ width: '100%', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <Skeleton width="150px" height="2rem" />
                <Skeleton width="100px" height="2rem" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #f1f1f1', padding: '1.5rem 0' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ padding: '1.5rem', border: '1px solid #f1f1f1' }}>
                    <Skeleton height="1.2rem" width="40%" style={{ marginBottom: '1rem' }} />
                    <Skeleton height="2rem" width="70%" />
                </div>
            ))}
        </div>
    );
};

// 5. Cart Skeleton
export const CartSkeleton = () => {
    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Skeleton width="200px" height="2.5rem" style={{ marginBottom: '1rem' }} />
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ display: 'flex', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f1f1' }}>
                            <Skeleton width="100px" height="130px" />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem' }}>
                                <Skeleton width="40%" height="1.2rem" />
                                <Skeleton width="20%" height="1rem" />
                                <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
                                    <Skeleton width="80px" height="2.5rem" />
                                    <Skeleton width="80px" height="2.5rem" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Note: In a luxury template, the right side could be another column for desktop, but for simplicity here we just focus on the list style */}
            </div>
        </div>
    );
};