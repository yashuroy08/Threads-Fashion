import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, X, ChevronDown, User, Heart, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { useCartContext } from '../context/CartContext';
import '../styles/navbar.css';

export function Navbar() {
    const { user } = useAuthContext();
    const { cart } = useCartContext();
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Search State
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Dropdown State
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Create a hierarchy map to avoid performance issues on render
    const [categoryTree, setCategoryTree] = useState<{ parents: any[], childrenMap: Record<string, any[]> }>({ parents: [], childrenMap: {} });

    // Close interactions when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
        setActiveDropdown(null);
        // Don't auto-close search on navigation if it leads to search page, handled separately
    }, [location]);

    useEffect(() => {
        fetch('/api/v1/categories')
            .then(res => res.json())
            .then(data => {
                if (!Array.isArray(data)) {
                    console.error('Navbar categories fetch returned non-array:', data);
                    return;
                }
                const allCats = data;
                const parents = allCats.filter((c: any) => !c.parentId);
                const childrenMap: Record<string, any[]> = {};

                parents.forEach((p: any) => {
                    childrenMap[p._id] = allCats.filter((c: any) => c.parentId === p._id);
                });

                setCategoryTree({ parents, childrenMap });
            })
            .catch(err => console.error('Navbar category fetch error:', err));
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Focus input when search expands
    useEffect(() => {
        if (searchExpanded && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchExpanded]);

    // Handle clicks outside to close dropdowns and search
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // Close dropdowns
            if (!target.closest('.nav-dropdown-group')) {
                setActiveDropdown(null);
            }

            // Close search if clicked outside
            if (!target.closest('.nav-search-container') && searchExpanded && !searchTerm) {
                setSearchExpanded(false);
            }

            // Close search results
            if (!target.closest('.nav-search-container')) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [searchExpanded, searchTerm]);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.trim().length > 1) {
                setSearchLoading(true);
                try {
                    const response = await fetch(
                        `/api/v1/products/search?q=${encodeURIComponent(searchTerm)}&limit=5`
                    );
                    const data = await response.json();
                    const items = Array.isArray(data.items) ? data.items : [];
                    const filtered = items.filter(
                        (p: any) => Array.isArray(p.images) && p.images[0] && !!p.images[0].url
                    );
                    setSearchResults(filtered);
                    setShowSearchResults(true);
                } catch (error) {
                    console.error('Search error:', error);
                    setSearchResults([]);
                } finally {
                    setSearchLoading(false);
                }
            } else {
                setSearchResults([]);
                setShowSearchResults(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleLogout = () => {
        navigate('/logout');
    };

    const toggleDropdown = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveDropdown(prev => prev === id ? null : id);
    };

    return (
        <header className={`navbar-wrapper ${scrolled ? 'scrolled' : ''}`} style={{ backgroundColor: '#111827' }}>
            <nav className="navbar-inner">
                {/* LEFT: Logo & Categories */}
                <div className="nav-left">
                    {location.pathname !== '/profile' && (
                        <button
                            className="mobile-menu-trigger lg:hidden"
                            onClick={() => setMobileMenuOpen(true)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#ffffff',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Search size={22} style={{ display: 'none' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <div style={{ width: '20px', height: '2px', background: '#ffffff' }}></div>
                                <div style={{ width: '15px', height: '2px', background: '#ffffff' }}></div>
                                <div style={{ width: '20px', height: '2px', background: '#ffffff' }}></div>
                            </div>
                        </button>
                    )}

                    <Link to="/" className="nav-brand">
                        THREADS<span>.</span>
                    </Link>

                    <div className="desktop-links hidden lg:flex">
                        {categoryTree.parents.map(parent => {
                            const hasChildren = categoryTree.childrenMap[parent._id] && categoryTree.childrenMap[parent._id].length > 0;
                            const isOpen = activeDropdown === parent._id;

                            return (
                                <div key={parent._id} className={`nav-dropdown-group ${isOpen ? 'active' : ''}`}>
                                    <div
                                        className="nav-link-wrapper"
                                        onClick={(e) => hasChildren ? toggleDropdown(parent._id, e) : navigate(`/products?category=${parent.slug}`)}
                                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <span className="nav-link">
                                            {parent.name}
                                        </span>
                                        {/* Always show arrow if it has children, or even if we want to indicate functionality */}
                                        {hasChildren && (
                                            <ChevronDown
                                                size={14}
                                                className={`dropdown-arrow ${isOpen ? 'rotate' : ''}`}
                                            />
                                        )}
                                    </div>

                                    {/* Dropdown Content */}
                                    {hasChildren && isOpen && (
                                        <div className="nav-dropdown-content show">
                                            {categoryTree.childrenMap[parent._id].map(child => (
                                                <Link
                                                    key={child._id}
                                                    to={`/products?category=${child.slug}`}
                                                    className="nav-dropdown-item"
                                                    onClick={() => setActiveDropdown(null)}
                                                >
                                                    {child.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT: Search & Actions */}
                <div className="nav-right">
                    {/* Search Component */}
                    <div className={`nav-search-container ${searchExpanded ? 'expanded' : ''}`}>
                        <button
                            className="search-toggle-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSearchExpanded(true);
                                setTimeout(() => searchInputRef.current?.focus(), 100);
                            }}
                        >
                            <Search size={20} />
                        </button>

                        <div className="search-input-wrapper">
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search..."
                                className="nav-search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (searchTerm.trim()) {
                                            navigate(`/products?q=${encodeURIComponent(searchTerm.trim())}`);
                                            setShowSearchResults(false);
                                            setSearchExpanded(false);
                                        }
                                    }
                                }}
                            />
                            {searchTerm && (
                                <button
                                    className="search-clear-btn"
                                    onClick={() => {
                                        setSearchTerm('');
                                        searchInputRef.current?.focus();
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {showSearchResults && searchExpanded && (
                            <div className="search-results-dropdown">
                                {searchLoading ? (
                                    <div className="search-result-item">Searching...</div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map((product) => (
                                        <Link
                                            key={product.id || product._id}
                                            to={`/products/${product.slug || product._id}`}
                                            className="search-result-item"
                                            onClick={() => {
                                                setShowSearchResults(false);
                                                setSearchTerm('');
                                                setSearchExpanded(false);
                                            }}
                                        >
                                            {product.images?.[0]?.url && (
                                                <img
                                                    src={product.images[0].url}
                                                    alt={product.title}
                                                    className="search-result-image"
                                                />
                                            )}
                                            <div className="search-result-info">
                                                <div className="search-result-title">{product.title}</div>
                                                <div className="search-result-price">
                                                    {product.price.currency} {(product.price.amount / 100).toLocaleString()}
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="search-result-item">No products found</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="nav-actions">
                        {/* Wishlist Link - Visible on Mobile */}
                        <Link to="/wishlist" className="nav-icon-btn" title="Wishlist">
                            <Heart size={20} />
                        </Link>

                        {/* Admin Link - Visible on Mobile if Admin */}
                        {(user?.role === 'admin') && (
                            <Link to="/admin" className="nav-icon-btn" title="Admin Dashboard">
                                <LayoutDashboard size={20} />
                            </Link>
                        )}

                        {/* Cart Link - Visible on Mobile */}
                        <Link to="/cart" className="nav-icon-btn">
                            <ShoppingBag size={20} />
                            {(cart?.items?.length || 0) > 0 && (
                                <span className="cart-badge">
                                    {cart?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0}
                                </span>
                            )}
                        </Link>

                        {/* Sign In (Unauth) / Profile (Auth) */}
                        {!user ? (
                            <Link to="/login" className="nav-signin-btn">
                                Sign In
                            </Link>
                        ) : (
                            <Link to="/profile" className="nav-icon-btn mobile-hidden hidden sm:flex" title="My Profile">
                                <User size={20} />
                            </Link>
                        )}

                        {/* Logout Button (Last & Red) - Hidden on Mobile */}
                        {user && (
                            <button
                                onClick={handleLogout}
                                className="nav-icon-btn mobile-hidden hidden sm:flex"
                                title="Logout"
                                style={{ color: '#ef4444' }}
                            >
                                <LogOut size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex'
                }} onClick={() => setMobileMenuOpen(false)}>
                    <div style={{
                        width: '320px',
                        background: '#111827',
                        height: '100%',
                        padding: '2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        overflowY: 'auto'
                    }} onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <span className="nav-brand" style={{ color: '#ffffff' }}>THREADS.</span>
                            <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffffff' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <Link to="/" className="nav-link" style={{ fontSize: '1.1rem', padding: '0.75rem 0' }}>Home</Link>
                        {/* Dynamic Links would optionally go here too, but for now fixed "Shop All" */}
                        <Link to="/products" className="nav-link" style={{ fontSize: '1.1rem', padding: '0.75rem 0' }}>Shop All</Link>

                        {/* Divider */}
                        <div style={{ height: '1px', background: 'var(--fashion-border)', margin: '1rem 0' }}></div>

                        {/* User Actions */}
                        {!user ? (
                            <>
                                <Link to="/login" className="nav-link" style={{ fontSize: '1.1rem', padding: '0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <User size={18} /> Sign In
                                </Link>
                                <Link to="/register" className="nav-link" style={{ fontSize: '1.1rem', padding: '0.75rem 0' }}>
                                    Create Account
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/profile" className="nav-link" style={{ fontSize: '1.1rem', padding: '0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <User size={18} /> My Profile
                                </Link>
                                {user.role === 'admin' && (
                                    <Link to="/admin" className="nav-link" style={{ fontSize: '1.1rem', padding: '0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <User size={16} /> Admin Panel
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="nav-link"
                                    style={{
                                        fontSize: '1.1rem',
                                        padding: '0.75rem 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        width: '100%',
                                        color: '#ef4444'
                                    }}
                                >
                                    <LogOut size={18} /> Logout
                                </button>
                            </>
                        )}

                        {/* Cart Link */}
                        <Link to="/cart" className="nav-link" style={{
                            fontSize: '1.1rem',
                            padding: '0.75rem 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            position: 'relative'
                        }}>
                            <ShoppingBag size={18} /> Shopping Bag
                            {(cart?.items?.length || 0) > 0 && (
                                <span style={{
                                    background: 'var(--fashion-accent)',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '999px',
                                    fontWeight: '600'
                                }}>
                                    {cart?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            )}


        </header>
    );
}
