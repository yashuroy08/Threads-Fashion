import { useMemo, useState } from 'react';
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
    // State for selected color variant
    const [selectedColor, setSelectedColor] = useState<string | null>(
        product.colors && product.colors.length > 0 ? product.colors[0] : null
    );

    // Filter images based on selected color (if any)
    const filteredImages = useMemo(() => {
        if (!product.images || product.images.length === 0) return [];
        if (!selectedColor) return product.images.slice(0, 4);

        const colorImages = product.images.filter(img => 
            img.color && img.color.toLowerCase() === selectedColor.toLowerCase()
        );
        
        if (colorImages.length > 0) return colorImages;
        
        // Fallback: map color index to image index to ensure image changes on click
        if (product.colors) {
            const colorIndex = product.colors.findIndex(c => c.toLowerCase() === selectedColor.toLowerCase());
            if (colorIndex >= 0) {
                return [product.images[colorIndex % product.images.length]];
            }
        }
        
        return product.images.slice(0, 4);
    }, [product.images, selectedColor, product.colors]);



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
                    className="wishlist-btn absolute top-2 right-2 z-20 bg-white/90 rounded-full shadow-sm hover:scale-110 transition-transform"
                    onClick={(e) => {
                        e.preventDefault();
                        addToWishlist(product.id || product._id || '');
                    }}
                    aria-label="Add to Wishlist"
                >
                    <Heart size={16} strokeWidth={2} className="hover:fill-red-500 hover:text-red-500 transition-colors" />
                </button>
            </div>

            <div className="prod-info">
                <span className="prod-meta block font-semibold text-gray-400 uppercase tracking-wider">
                    Premium Cotton
                </span>

                <Link to={`/products/${product.slug}`} className="prod-title block font-semibold text-gray-900 no-underline hover:text-black">
                    {product.title}
                </Link>

                <div className="product-card-footer">
                    <div className="price-wrapper">
                        <span className="prod-price">₹{displayPrice}</span>
                        {discountedPrice && (
                            <span className="original-price">
                                ₹{discountedPrice}
                            </span>
                        )}
                    </div>
                </div>

                {/* Color Swatches */}
                {product.colors && product.colors.length > 0 && (
                    <div className="product-color-display">
                        {product.colors.map(color => (
                            <button
                                key={color}
                                className={`color-swatch-btn ${selectedColor === color ? 'active' : ''}`}
                                style={{ backgroundColor: color.toLowerCase() }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedColor(color);
                                }}
                                title={color}
                                type="button"
                                aria-label={`Select ${color}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
