import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCartContext } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Heart, Minus, Plus, Truck, ShieldCheck, RotateCcw, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductDetailsSkeleton } from '../components/SkeletonLoader';
import RelatedProducts from '../components/RelatedProducts';
import '../styles/product-details.css';
import Breadcrumb from '../components/Breadcrumb';

type ProductVariant = {
    size: string;
    color: string;
    stock: number;
    reservedStock: number;
    availableStock: number;
    sku?: string;
};

export type Product = {
    slug: any;
    _id: string; // Changed to match likely backend ID
    id?: string; // Fallback
    title: string;
    description: string;
    price: {
        amount: number;
        currency: string;
    };
    category?: string;
    parentCategory?: { name: string; slug: string };
    childCategory?: { name: string; slug: string };
    parentCategoryId?: string;
    images?: { url: string; altText?: string; color?: string }[];
    sizes?: string[];
    colors?: string[];
    variants?: ProductVariant[];  // Variant-level stock
    stock: number;
    reservedStock?: number;
    isFeatured?: boolean;
    discountPercentage?: number;
};

// --- REUSABLE VIEW COMPONENT ---
export function ProductDetailsView({ product, isPreview = false }: { product: Product | null; isPreview?: boolean }) {
    const { addToCart, cart } = useCartContext();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const thumbnailRef = useRef<HTMLDivElement>(null);

    // Interaction State
    const [selectedSize, setSelectedSize] = useState<string>('');
    // Fix: Pre-select first color by default
    const [selectedColor, setSelectedColor] = useState<string>(product?.colors?.[0] || '');

    // Ensure selection remains valid if product changes
    useEffect(() => {
        if (product?.colors?.length) {
            if (!selectedColor || !product.colors.includes(selectedColor)) {
                setSelectedColor(product.colors[0]);
            }
        } else if (!product?.colors?.length) {
            setSelectedColor('');
        }
    }, [product]);
    const [quantity, setQuantity] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [error, setError] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'description' | 'details'>('description');
    const [isAdded, setIsAdded] = useState(false);

    // Find specific variant based on selection
    const currentVariant = useMemo(() => {
        if (!product?.variants?.length) return null;
        return product.variants.find(v =>
            v.size === selectedSize &&
            v.color.toLowerCase() === selectedColor?.toLowerCase()
        );
    }, [product, selectedSize, selectedColor]);

    // Determine effective stock limit

    const currentStock = useMemo(() => {
        if (product?.variants?.length) {
            // If a specific variant is identified (Size + Color)
            if (currentVariant) {
                return (currentVariant.availableStock || currentVariant.stock);
            }

            // If only Color is selected (or nothing), sum up stock for that color
            // so we don't show "Out of Stock" just because Size isn't picked yet.
            const relevantVariants = selectedColor
                ? product.variants.filter(v => v.color.toLowerCase() === selectedColor.toLowerCase())
                : product.variants;

            return relevantVariants.reduce((acc, v) => acc + (v.availableStock || v.stock || 0), 0);
        }
        return product?.stock || 0;
    }, [product, currentVariant, selectedColor]);

    // Reset quantity if it exceeds new stock limit (e.g. switching variants)
    useEffect(() => {
        if (quantity > currentStock && currentStock > 0) {
            setQuantity(currentStock);
        } else if (currentStock === 0 && quantity !== 1) {
            setQuantity(1);
        }
    }, [currentStock, quantity]);

    // Check if this specific selection (product + size + color) is already in the cart
    const alreadyInCart = useMemo(() => {
        if (!cart || !product) return false;
        return cart.items.some(item => {
            const itemProdId = typeof item.productId === 'string' ? item.productId : item.productId._id;
            const targetProdId = product._id || product.id || '';
            const sizeMatch = !product.sizes?.length || item.size === selectedSize;
            const colorMatch = !product.colors?.length || item.color === selectedColor;
            return itemProdId === targetProdId && sizeMatch && colorMatch;
        });
    }, [cart, product, selectedSize, selectedColor]);

    // Reset added state when selection changes
    useEffect(() => {
        setIsAdded(false);
    }, [selectedSize, selectedColor, quantity]);

    const filteredImages = (product?.images?.filter(img =>
        !selectedColor || !img.color || img.color === selectedColor
    ) || []).sort((a, b) => {
        // Prioritize images that specifically match the selected color
        if (selectedColor) {
            const aMatch = a.color === selectedColor;
            const bMatch = b.color === selectedColor;
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
        }
        return 0;
    });

    const displayImages = filteredImages.length > 0 ? filteredImages : (product?.images || []);

    // Reset active index when color filter changes results
    useEffect(() => {
        setActiveImageIndex(0);
    }, [selectedColor, displayImages.length]);

    // Scroll active thumbnail into view
    useEffect(() => {
        if (thumbnailRef.current) {
            const activeThumb = thumbnailRef.current.children[activeImageIndex] as HTMLElement;
            if (activeThumb) {
                activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [activeImageIndex]);

    const handlePrevImage = () => {
        setActiveImageIndex(prev => (prev - 1 + displayImages.length) % displayImages.length);
    };

    const handleNextImage = () => {
        setActiveImageIndex(prev => (prev + 1) % displayImages.length);
    };

    const handleAddToCart = async () => {
        if (isPreview) return; // Disable in preview
        if (!product) return;
        setError('');

        if (product.sizes?.length && !selectedSize) {
            setError('Please select a size');
            return;
        }

        if (product.colors?.length && !selectedColor) {
            setError('Please select a color');
            return;
        }

        try {
            const success = await addToCart(product._id || product.id || '', quantity, selectedSize, selectedColor);
            if (success) setIsAdded(true);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleWishlist = () => {
        if (isPreview) return;
        if (!product) return;
        const prodId = product._id || product.id || '';
        if (isInWishlist(prodId)) {
            removeFromWishlist(prodId);
        } else {
            addToWishlist(prodId);
        }
    };

    if (!product) return <ProductDetailsSkeleton />;

    const inWishlist = product ? isInWishlist(product._id || product.id || '') : false;

    return (
        <div className="product-details-container">
            {/* Breadcrumbs */}
            {!isPreview && (
                <Breadcrumb
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Shop', href: '/products' },
                        ...(product.parentCategory ? [{ label: product.parentCategory.name, href: `/products?parentCategory=${product.parentCategory.slug}` }] : []),
                        ...(product.childCategory ? [{ label: product.childCategory.name, href: `/products?childCategory=${product.childCategory.slug}` }] : []),
                        { label: product.title, href: `/products/${product.slug}` } // Active
                    ]}
                />
            )}

            <div className="product-main-wrapper">
                {/* LEFT: IMAGES */}
                <div className="product-gallery">
                    <div className="main-image-container">
                        {displayImages.length > 0 ? (
                            <>
                                <img
                                    src={displayImages[activeImageIndex].url}
                                    alt={displayImages[activeImageIndex].altText || product.title}
                                    className="main-image"
                                />
                                {displayImages.length > 1 && (
                                    <>
                                        <button className="gallery-nav prev" onClick={handlePrevImage}><ChevronLeft size={24} /></button>
                                        <button className="gallery-nav next" onClick={handleNextImage}><ChevronRight size={24} /></button>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="placeholder-image">No Image</div>
                        )}
                        <button className={`wishlist-fab ${inWishlist ? 'active' : ''}`} onClick={handleWishlist}>
                            <Heart size={20} fill={inWishlist ? "currentColor" : "none"} />
                        </button>
                    </div>

                    {/* Thumbnails */}
                    {displayImages.length > 1 && (
                        <div className="thumbnails-scroll-container" ref={thumbnailRef}>
                            {displayImages.map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`thumbnail-item ${idx === activeImageIndex ? 'active' : ''}`}
                                    onClick={() => setActiveImageIndex(idx)}
                                >
                                    <img src={img.url} alt={img.altText || `View ${idx + 1}`} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT: INFO */}
                <div className="product-info-section">
                    <h1 className="product-title">{product.title}</h1>

                    <div className="product-price-row">
                        <span className="current-price">₹{(product.price.amount / 100).toFixed(2)}</span>
                    </div>

                    <div className="product-meta-row">
                        {currentStock > 0 ? (
                            <span className="stock-badge in-stock"><Check size={14} /> In Stock</span>
                        ) : (
                            <span className="stock-badge out-of-stock">Out of Stock</span>
                        )}
                        <span className="sku-text">SKU: {product._id?.substring(0, 8).toUpperCase() || 'PREVIEW'}</span>
                    </div>

                    <p className="short-description">
                        {product.description.substring(0, 150)}...
                        <button className="read-more-link" onClick={() => {
                            setActiveTab('description');
                            document.getElementById('details-tabs')?.scrollIntoView({ behavior: 'smooth' });
                        }}>Read more</button>
                    </p>

                    <div className="divider"></div>

                    {/* SELECTIONS */}
                    <div className="selectors-container">
                        {/* COLOR */}
                        {product.colors && product.colors.length > 0 && (
                            <div className="selector-group">
                                <label className="selector-label">Color: <span className="selected-value">{selectedColor || 'Select'}</span></label>
                                <div className="color-options">
                                    {product.colors.map(color => (
                                        <button
                                            key={color}
                                            className={`color-btn ${selectedColor === color ? 'selected' : ''}`}
                                            onClick={() => setSelectedColor(color)}
                                            title={color}
                                            style={{ backgroundColor: color.toLowerCase() }}
                                        >
                                            {selectedColor === color && <Check size={12} color={['white', 'yellow', 'cream'].includes(color.toLowerCase()) ? '#000' : '#fff'} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SIZE */}
                        {product.sizes && product.sizes.length > 0 && (
                            <div className="selector-group">
                                <label className="selector-label">Size: <span className="selected-value">{selectedSize || 'Select'}</span></label>
                                <div className="size-options">
                                    {product.sizes.map(size => (
                                        <button
                                            key={size}
                                            className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                                            onClick={() => setSelectedSize(size)}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                                <button className="size-guide-btn">Size Guide</button>
                            </div>
                        )}

                        {/* QUANTITY */}
                        <div className="selector-group">
                            <label className="selector-label">
                                Quantity
                                {currentStock > 0 && currentStock <= 10 && (
                                    <span className="low-stock-alert" style={{ color: '#dc2626', fontSize: '0.75rem', marginLeft: '8px', fontWeight: 500 }}>
                                        (Only {currentStock} left!)
                                    </span>
                                )}
                            </label>
                            <div className="quantity-control">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1 || currentStock === 0}
                                >
                                    <Minus size={16} />
                                </button>
                                <span>{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                                    disabled={quantity >= currentStock}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* ERROR MSG */}
                        {error && <div className="error-message">{error}</div>}

                        {/* ACTIONS */}
                        <div className="action-buttons">
                            {(isAdded || alreadyInCart) ? (
                                <Link to="/cart" className="btn-add-cart success">
                                    <Check size={20} /> MOVE TO CART
                                </Link>
                            ) : (
                                <button className="btn-add-cart" onClick={handleAddToCart} disabled={currentStock <= 0 || isPreview}>
                                    {currentStock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                </button>
                            )}
                        </div>

                        {/* USPs */}
                        <div className="usp-grid">
                            <div className="usp-item">
                                <Truck size={20} strokeWidth={1.5} />
                                <span>Free Shipping</span>
                            </div>
                            <div className="usp-item">
                                <ShieldCheck size={20} strokeWidth={1.5} />
                                <span>Authentic</span>
                            </div>
                            <div className="usp-item">
                                <RotateCcw size={20} strokeWidth={1.5} />
                                <span>easy Returns</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABS FOR DETAILS/DESC */}
            <div className="details-tabs-section" id="details-tabs">
                <div className="tabs-header">
                    <button
                        className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
                        onClick={() => setActiveTab('description')}
                    >
                        Description
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Details
                    </button>
                </div>
                <div className="tab-content">
                    {activeTab === 'description' ? (
                        <div className="description-content">
                            <p>{product.description}</p>
                        </div>
                    ) : (
                        <div className="details-content">
                            <ul className="details-list">
                                <li><strong>Material:</strong> Premium Cotton Blend</li>
                                <li><strong>Fit:</strong> Regular Fit</li>
                                <li><strong>Care:</strong> Machine Wash Cold</li>
                                <li><strong>Origin:</strong> Made in India</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {!isPreview && (
                <RelatedProducts currentProductId={product._id || product.id || ''} category={product.parentCategory?.slug || product.category} />
            )}
        </div>
    );
}

// --- MAIN PAGE COMPONENT ---
export default function ProductDetails() {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/v1/products/${id}`)
            .then(res => res.json())
            .then(data => {
                setProduct(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <ProductDetailsSkeleton />;
    if (!product) return <div className="error-container">Product not found</div>;

    return <ProductDetailsView product={product} />;
}
