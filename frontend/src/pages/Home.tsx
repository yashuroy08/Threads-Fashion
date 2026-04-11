import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Truck, ShieldCheck, RefreshCw, Headphones, ArrowRight, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/global.css';
import '../styles/landing.css';
import { API_BASE } from '../config/api.config';


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
    images?: { url: string }[];
    slug: string;
}

const EditorialShowcase = ({ title, categorySlug, products, isReversed }: { title: string, categorySlug: string, products: Product[], isReversed: boolean }) => {
    if (products.length === 0) return null;
    
    // Pick the first product as the "Featured" lifestyle product
    const featuredProduct = products[0];
    const otherProducts = products.slice(1, 4);

    return (
        <section className={`editorial-section ${isReversed ? 'editorial-reversed' : ''}`}>
             <div className="editorial-featured reveal-on-scroll">
                 <Link to={`/products/${featuredProduct.slug}`} className="editorial-featured-link">
                     {featuredProduct.images?.[0]?.url ? (
                         <img src={featuredProduct.images[0].url} alt={featuredProduct.title} className="editorial-main-img" />
                     ) : (
                         <div className="editorial-main-img placeholder" />
                     )}
                     <div className="editorial-featured-overlay">
                         <span className="editorial-shop-btn">Shop The Look</span>
                     </div>
                 </Link>
             </div>

             <div className="editorial-content-wrapper">
                 <div className="editorial-story reveal-on-scroll" style={{ transitionDelay: '0.2s' }}>
                      <span className="editorial-subtitle">Curated Collection</span>
                      <h2 className="editorial-title">{title}</h2>
                      <p className="editorial-text">
                        Discover our new arrivals tailored for excellence. Blending classic design with a modern edge to redefine your everyday style.
                      </p>
                      <Link to={`/products?parentCategory=${categorySlug}`} className="editorial-cta-btn">
                           Explore {title.split("'")[0]}
                      </Link>
                 </div>

                 <div className="editorial-side-products">
                     {otherProducts.map((product, idx) => (
                         <Link to={`/products/${product.slug}`} key={product.id} className="editorial-small-card reveal-on-scroll" style={{ transitionDelay: `${0.3 + idx * 0.15}s` }}>
                            <div className="img-wrap">
                                {product.images?.[0]?.url ? (
                                    <img src={product.images[0].url} alt={product.title} className="editorial-small-img" />
                                ) : (
                                    <div className="editorial-small-img placeholder" />
                                )}
                            </div>
                            <div className="editorial-small-info">
                                <h4>{product.title}</h4>
                            </div>
                         </Link>
                     ))}
                 </div>
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

    useEffect(() => {
        const fetchCategoryProducts = async (category: string, setter: (products: Product[]) => void) => {
            try {
                const res = await fetch(`${API_BASE}/products?parentCategory=${category}&limit=8&sortBy=newest`);
                const data = await res.json();
                const items = data.content || data.items || (Array.isArray(data) ? data : []);
                setter(items);
            } catch (err) {
                console.error(`Failed to fetch ${category} products:`, err);
            }
        };

        fetchCategoryProducts('men', setMenProducts);
        fetchCategoryProducts('women', setWomenProducts);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        }, 8000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // Optional: stop observing once revealed
                    // observer.unobserve(entry.target); 
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        const revealElements = document.querySelectorAll('.reveal-on-scroll');
        revealElements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, [categoryCards, menProducts, womenProducts]);

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
        fetch(`${API_BASE}/products?limit=50&sortBy=newest`)
            .then(res => res.json())
            .then(data => {
                const items = data.content || data.items || (Array.isArray(data) ? data : []);

                const uniqueCategories = new Map();

                items.forEach((p: any) => {
                    const hasClassicPopulated = p.childCategory && p.parentCategory;
                    const hasFlatPopulated = p.childCategoryId && p.parentCategoryId;
                    
                    if ((hasClassicPopulated || hasFlatPopulated) && p.images && p.images.length > 0 && p.images[0].url) {
                        const childId = p.childCategory?._id || p.childCategory?.id || p.childCategoryId;
                        const childName = p.childCategory?.name || p.childCategoryName || '';
                        // Prefer API slug; never derive from name alone — "T-Shirts" -> t-shirts does not match DB slugs like kids-tshirts.
                        const childSlug = p.childCategory?.slug || '';

                        const parentId = p.parentCategory?._id || p.parentCategory?.id || p.parentCategoryId;
                        const parentName = p.parentCategory?.name || p.parentCategoryName || '';
                        const parentSlug = p.parentCategory?.slug || (p.parentCategoryName || '').toLowerCase().replace(/ /g, '-');

                        // Dedupe by stable child id when present (avoids collisions on duplicate display names).
                        const key = (childId && String(childId)) || childSlug || childName;
                        if (key && childId && parentId && !uniqueCategories.has(key)) {
                            // Filter out 'kids' temporarily
                            if (parentSlug !== 'kids' && parentName.toLowerCase() !== 'kids') {
                                uniqueCategories.set(key, {
                                    childId: String(childId),
                                    childName,
                                    childSlug,
                                    parentId: String(parentId),
                                    parentName,
                                    parentSlug,
                                    image: p.images[0].url
                                });
                            }
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
            <section className="products-section reveal-on-scroll">
                <div className="section-header">
                    <span className="section-subtitle">Curated Styles</span>
                    <h2 className="section-title">Trending Categories</h2>
                </div>

                <div className="category-rail">
                    {categoryCards.length === 0 ? (
                        <p className="loading-text">Loading categories...</p>
                    ) : (
                        categoryCards.map((cat) => (
                            <Link
                                to={`/products?parentCategory=${encodeURIComponent(cat.parentId)}&childCategory=${encodeURIComponent(cat.childId)}`}
                                key={cat.childId}
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
            <EditorialShowcase title="Men's Edit" categorySlug="men" products={menProducts} isReversed={false} />
            <EditorialShowcase title="Women's Edit" categorySlug="women" products={womenProducts} isReversed={true} />

            {/* FEATURES SECTION */}
            <section className="features-section reveal-on-scroll">
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
            <section className="newsletter-section reveal-on-scroll">
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
