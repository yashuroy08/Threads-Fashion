import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import '../styles/products.css';

// Shared Type Definition (can be moved to a types file later)
export interface Product {
    id: string;
    _id?: string;
    slug: string;
    title: string;
    price: {
        amount: number;
        currency: string;
    };
    images: {
        url: string;
        altText?: string;
        color?: string;
    }[];
    colors?: string[]; // e.g. ["Blue", "Black"]
    sizes?: string[];
    isFeatured?: boolean;
    discountPercentage?: number;
    inStock: boolean;
    isNew?: boolean;
}

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToWishlist } = useWishlist();

    // State for selected color variant (defaults to first color available, or null)
    // const [selectedColor, setSelectedColor] = useState<string | null>(
    //     product.colors && product.colors.length > 0 ? product.colors[0] : null
    // );
    // Simplified: No selection state needed as we disabled interaction.
    const selectedColor = product.colors && product.colors.length > 0 ? product.colors[0] : null;

    // Filter images based on selected color (if any)
    const filteredImages = useMemo(() => {
        if (!product.images) return [];
        if (!selectedColor) return product.images.slice(0, 4); // specific "4 images" request if no color

        const colorImages = product.images.filter(img => img.color === selectedColor);
        // Fallback: If no specific images for this color, show generic ones or just the first few
        return colorImages.length > 0 ? colorImages : product.images.slice(0, 4);
    }, [product.images, selectedColor]);



    // Calculate Price
    const displayPrice = product.price.amount / 100;
    const discountedPrice = product.discountPercentage
        ? Math.round(displayPrice * (100 / (100 - product.discountPercentage)))
        : null;

    return (
        <div className="product-card">
            <div className="product-image-container">
                <Link to={`/products/${product.slug}`} className="product-image-link">
                    {/* Main Image (Always Visible) */}
                    {filteredImages.length > 0 ? (
                        <img
                            src={filteredImages[0].url}
                            alt={filteredImages[0].altText || product.title}
                            className={`carousel-image active`} // Always active base
                            style={{ opacity: 1, zIndex: 1 }}
                            loading="lazy"
                        />
                    ) : (
                        <div className="no-image-placeholder">No Image</div>
                    )}

                    {/* Stock & Badge Labels */}
                    {!product.inStock && (
                        <div className="prod-label label-out-of-stock">Out of Stock</div>
                    )}
                    {product.isNew && product.inStock && (
                        <div className="prod-label label-new">New Arrival</div>
                    )}
                    {product.discountPercentage && product.discountPercentage > 0 && product.inStock && (
                        <div className="prod-label label-sale">-{product.discountPercentage}%</div>
                    )}
                </Link>

                {/* Carousel Navigation Removed for cleaner UX per request */}


                {/* Wishlist Button: Top Right */}
                <button
                    className="wishlist-btn absolute top-3 right-3 z-20 bg-white/90 p-2 rounded-full shadow-sm hover:scale-110 transition-transform"
                    onClick={(e) => {
                        e.preventDefault();
                        addToWishlist(product.id || product._id || '');
                    }}
                    aria-label="Add to Wishlist"
                >
                    <Heart size={20} className="hover:fill-red-500 hover:text-red-500 transition-colors" />
                </button>
            </div>

            <div className="prod-info p-4">
                <span className="prod-meta block mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Premium Cotton
                </span>

                <Link to={`/products/${product.slug}`} className="prod-title block text-base font-semibold text-gray-900 mb-2 no-underline hover:text-black">
                    {product.title}
                </Link>

                <div className="flex justify-between items-center mb-3">
                    <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '4px' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, marginRight: '16px', color: '#111827' }}>₹{displayPrice}</span>
                        {discountedPrice && (
                            <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.9rem' }}>
                                ₹{discountedPrice}
                            </span>
                        )}
                    </div>
                </div>

                {/* Color Swatches */}
                {/* Color Swatches (Display Only) */}
                {product.colors && product.colors.length > 0 && (
                    <div className="product-color-display">
                        {product.colors.map(color => (
                            <div
                                key={color}
                                className="static-color-circle"
                                style={{ backgroundColor: color.toLowerCase() }}
                                title={color}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
