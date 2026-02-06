import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Truck, ShieldCheck, RefreshCw, Headphones, ArrowRight, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/global.css';
import '../styles/landing.css';


const HERO_SLIDES = [
    {
        image: "https://images.unsplash.com/photo-1560014732-6d619527419b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        badge: "New In Collections",
        title: "Timeless\nElegance",
        subtitle: "Discover our curated collection of premium fashion pieces\ndesigned for the modern lifestyle.",
        ctaPrimary: "Shop Men",
        linkPrimary: "/products?parentCategory=men",
        ctaSecondary: "Explore Collection",
        linkSecondary: "/products"
    },
    {
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1600",
        badge: "Women's Collection",
        title: "Sharp &\nSophisticated",
        subtitle: "Refined basics and statement pieces for the modern woman.\nQuality that speaks for itself.",
        ctaPrimary: "Shop Women",
        linkPrimary: "/products?parentCategory=women"
    },
    {
        image: "https://images.unsplash.com/photo-1622290291165-d341f1938b8a?auto=format&fit=crop&q=80&w=1600",
        badge: "Kids' Corner",
        title: "Playful\nAdventure",
        subtitle: "Comfortable and stylish wear for the little ones.\nReady for every discovery.",
        ctaPrimary: "Shop Kids",
        linkPrimary: "/products?parentCategory=kids"
    },
    {
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600",
        badge: "Exclusive Drop",
        title: "Urban\nLuxury",
        subtitle: "Elevate your style with our limited edition pieces.\nCrafted for perfection.",
        ctaPrimary: "Explore All",
        linkPrimary: "/products"
    }
];


interface Product {
    id: string;
    title: string;
    price: { amount: number };
    images: { url: string }[];
    slug: string;
}

const CategoryShowcase = ({ title, categorySlug, products }: { title: string, categorySlug: string, products: Product[] }) => {
    if (products.length === 0) return null;
    return (
        <section className="product-showcase-section">
            <div className="showcase-header">
                <h2 className="showcase-title">{title}</h2>
                <Link to={`/products?parentCategory=${categorySlug}`} className="btn-showcase-cta">
                    Shop {title.split("'")[0]} <ArrowRight size={16} />
                </Link>
            </div>
            <div className="product-rail">
                {products.map((product) => (
                    <Link to={`/products/${product.slug}`} key={product.id} className="showcase-card">
                        <div className="showcase-img-wrapper">
                            <img src={product.images[0].url} alt={product.title} className="showcase-img" />
                        </div>
                        <div className="showcase-info">
                            <h4>{product.title}</h4>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default function Home() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [categoryCards, setCategoryCards] = useState<{
        childId: string;
        childName: string;
        childSlug: string;
        parentId: string;
        parentName: string;
        parentSlug: string;
        image: string;
    }[]>([]);

    const [menProducts, setMenProducts] = useState<Product[]>([]);
    const [womenProducts, setWomenProducts] = useState<Product[]>([]);
    const [kidsProducts, setKidsProducts] = useState<Product[]>([]);

    useEffect(() => {
        const fetchCategoryProducts = async (category: string, setter: (products: Product[]) => void) => {
            try {
                const res = await fetch(`/api/v1/products?parentCategory=${category}&limit=8&sort=newest`);
                const data = await res.json();
                const items = data.items || (Array.isArray(data) ? data : []);
                setter(items.filter((p: Product) => p.images && p.images.length > 0));
            } catch (err) {
                console.error(`Failed to fetch ${category} products:`, err);
            }
        };

        fetchCategoryProducts('men', setMenProducts);
        fetchCategoryProducts('women', setWomenProducts);
        fetchCategoryProducts('kids', setKidsProducts);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        }, 8000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    };

    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null); // Reset touch end
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            nextSlide();
        }
        if (isRightSwipe) {
            prevSlide();
        }
    };

    useEffect(() => {
        // Fetch a larger set to ensure we get a diverse range of categories
        fetch('/api/v1/products?limit=50&sort=newest')
            .then(res => res.json())
            .then(data => {
                const items = data.items || (Array.isArray(data) ? data : []);

                const uniqueCategories = new Map();

                items.forEach((p: any) => {
                    // We need both parent and child, and a valid image to build the correct link
                    if (p.childCategory && p.parentCategory && p.images && p.images.length > 0 && p.images[0].url) {
                        const key = p.childCategory.slug;
                        if (!uniqueCategories.has(key)) {
                            uniqueCategories.set(key, {
                                childId: p.childCategory._id || p.childCategory.id, // Handle different population shapes if any
                                childName: p.childCategory.name,
                                childSlug: p.childCategory.slug,
                                parentId: p.parentCategory._id || p.parentCategory.id,
                                parentName: p.parentCategory.name,
                                parentSlug: p.parentCategory.slug,
                                image: p.images[0].url
                            });
                        }
                    }
                });

                // Convert map to array and slice to 8 for the grid
                setCategoryCards(Array.from(uniqueCategories.values()).slice(0, 8));
            })
            .catch(err => console.error('Failed to fetch products for categories:', err));
    }, []);

    return (
        <div className="landing-wrapper">
            {/* HERO SECTION */}
            <section
                className="hero-slider-section"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {HERO_SLIDES.map((slide, index) => (
                    <div
                        key={index}
                        className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                    >
                        <img
                            src={slide.image}
                            alt="Hero Background"
                            className="hero-image"
                        />
                        <div className="hero-overlay">
                            <div className="hero-content">
                                <span className="hero-badge" style={{ animationDelay: '0.2s' }}>{slide.badge}</span>
                                <h1 className="hero-title">
                                    {slide.title.split('\n').map((line, i) => (
                                        <span key={i} style={{ display: 'block' }}>{line}</span>
                                    ))}
                                </h1>
                                <p className="hero-description">
                                    {slide.subtitle.split('\n').map((line, i) => (
                                        <span key={i} style={{ display: 'block' }}>{line}</span>
                                    ))}
                                </p>
                                <div className="hero-buttons">
                                    {slide.ctaPrimary && (
                                        <Link to={slide.linkPrimary} className="btn-hero btn-primary">
                                            {slide.ctaPrimary} <ArrowRight size={16} />
                                        </Link>
                                    )}
                                    {slide.ctaSecondary && (
                                        <Link to={slide.linkSecondary} className="btn-hero btn-secondary">
                                            {slide.ctaSecondary}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Carousel Controls */}
                <button className="slider-arrow prev" onClick={prevSlide} aria-label="Previous Slide">
                    <ChevronLeft size={32} />
                </button>
                <button className="slider-arrow next" onClick={nextSlide} aria-label="Next Slide">
                    <ChevronRight size={32} />
                </button>

                <div className="slider-dots">
                    {HERO_SLIDES.map((_, index) => (
                        <button
                            key={index}
                            className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => setCurrentSlide(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </section>

            {/* CHILD CATEGORIES GRID */}
            <section className="products-section">
                <div className="section-header">
                    <span className="section-subtitle">Curated Styles</span>
                    <h2 className="section-title">Trending Categories</h2>
                </div>

                <div className="landing-products-grid">
                    {categoryCards.length === 0 ? (
                        <p className="loading-text">Loading categories...</p>
                    ) : (
                        categoryCards.map((cat) => (
                            <Link
                                to={`/products?parentCategory=${cat.parentSlug}&childCategory=${cat.childSlug}`}
                                key={cat.childSlug}
                                className="landing-product-card category-visual-card"
                            >
                                <div className="landing-product-img-wrapper">
                                    <img
                                        src={cat.image}
                                        alt={cat.childName}
                                        className="landing-product-img"
                                    />
                                    <div className="category-visual-overlay">
                                        <div className="cat-info">
                                            <span className="visual-cat-name">{cat.childName}</span>
                                            <span className="visual-cat-action">
                                                Explore Collection <ArrowRight size={14} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                    <Link to="/products" className="btn-hero btn-primary" style={{ border: '1px solid #000', color: '#000', background: 'transparent' }}>
                        View All Collections
                    </Link>
                </div>
            </section>

            {/* CATEGORY PRODUCT SHOWCASES */}
            <CategoryShowcase title="Men's Latest" categorySlug="men" products={menProducts} />
            <CategoryShowcase title="Women's Trends" categorySlug="women" products={womenProducts} />
            <CategoryShowcase title="Kids' Favorites" categorySlug="kids" products={kidsProducts} />

            {/* FEATURES SECTION */}
            <section className="features-section">
                <div className="feature-item">
                    <div className="feature-icon"><Truck size={24} /></div>
                    <div className="feature-info">
                        <h3>Free Shipping</h3>
                        <p>On orders over ₹1000</p>
                    </div>
                </div>
                <div className="feature-item">
                    <div className="feature-icon"><ShieldCheck size={24} /></div>
                    <div className="feature-info">
                        <h3>Secure Payment</h3>
                        <p>100% secure transactions</p>
                    </div>
                </div>
                <div className="feature-item">
                    <div className="feature-icon"><RefreshCw size={24} /></div>
                    <div className="feature-info">
                        <h3>Easy Returns</h3>
                        <p>30-day return policy</p>
                    </div>
                </div>
                <div className="feature-item">
                    <div className="feature-icon"><Headphones size={24} /></div>
                    <div className="feature-info">
                        <h3>24/7 Support</h3>
                        <p>Dedicated customer care</p>
                    </div>
                </div>
            </section>

            {/* NEWSLETTER SECTION */}
            <section className="newsletter-section">
                <div className="newsletter-content">
                    <div className="newsletter-icon">
                        <Mail size={32} color="#111827" strokeWidth={1.5} />
                    </div>
                    <h2 className="newsletter-title">Stay in Style</h2>
                    <p className="newsletter-desc">
                        Subscribe to our newsletter for exclusive access to new collections, special offers, and style inspiration.
                    </p>
                    <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                        <input type="email" placeholder="Enter your email" className="newsletter-input" required />
                        <button type="submit" className="newsletter-btn">Subscribe</button>
                    </form>
                    <p className="newsletter-disclaimer">
                        By subscribing, you agree to our Privacy Policy and Terms of Service.
                    </p>
                </div>
            </section>
        </div>
    );
}
