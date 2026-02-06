import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, User, Compass } from 'lucide-react';
import '../styles/mobile-navbar.css';

export default function MobileNavbar() {
    const location = useLocation();


    const navItems = [
        { label: 'Home', path: '/', icon: Home },
        { label: 'Categories', path: '/categories', icon: LayoutGrid },
        { label: 'Explore', path: '/products', icon: Compass }, // Changed to Compass as requested to avoid duplicate Cart icon
        { label: 'Profile', path: '/profile', icon: User },
    ];

    return (
        <nav className="mobile-navbar">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <Link
                        key={item.label}
                        to={item.path}
                        className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                    >
                        <div className="icon-container">
                            <item.icon strokeWidth={1.5} size={20} />

                        </div>
                        <span className="nav-label">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
