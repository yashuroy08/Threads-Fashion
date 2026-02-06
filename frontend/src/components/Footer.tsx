import { Link } from 'react-router-dom';
import {
    Instagram,
    Github,
    Mail,
    Phone,
    MapPin
} from 'lucide-react';
import '../styles/footer.css';

const Footer = () => {
    return (
        <footer className="footer-wrapper">
            <div className="footer-container">
                {/* Brand Column */}
                <div className="footer-column brand-col">
                    <Link to="/" className="brand-logo-footer">
                        THREADS<span>.</span>
                    </Link>
                    <p className="footer-desc">
                        Redefining modern essentials with a focus on quality,
                        minimalism, and sustainable craftsmanship.
                    </p>
                    <div className="social-links">
                        <a href="https://www.instagram.com/yashwanthp_08" target="_blank" rel="noreferrer" className="social-icon" title="Instagram">
                            <Instagram size={20} />
                        </a>
                        <a href="https://github.com/yashuroy08" target="_blank" rel="noreferrer" className="social-icon" title="Github">
                            <Github size={20} />
                        </a>
                    </div>
                </div>

                {/* Quick Links Column */}
                <div className="footer-column">
                    <h4>Shop</h4>
                    <ul className="footer-links">
                        <li><Link to="/products">All Products</Link></li>
                        <li><Link to="/products?category=men">Men's Collection</Link></li>
                        <li><Link to="/products?category=women">Women's Collection</Link></li>
                        <li><Link to="/products?category=kids">Kids Collection</Link></li>
                    </ul>
                </div>

                {/* Support Column */}
                <div className="footer-column">
                    <h4>Customer Care</h4>
                    <ul className="footer-links">
                        <li><Link to="/profile">My Account</Link></li>
                        <li><Link to="/profile">Track Order</Link></li>
                        <li><Link to="/terms">Shipping Info</Link></li>
                        <li><Link to="/terms">Returns</Link></li>
                    </ul>
                </div>

                {/* Contact Column */}
                <div className="footer-column contact-col">
                    <h4>Get in Touch</h4>
                    <ul className="contact-info">
                        <li>
                            <Mail size={16} />
                            <a href="mailto:threadsfashion@zohomail.in">threadsfashion@zohoin.com</a>
                        </li>
                        <li>
                            <Phone size={16} />
                            <a href="tel:+919876543210">+91 98765 43210</a>
                        </li>
                        <li>
                            <MapPin size={16} />
                            <span>Threads Fashion HQ, Andhra Pradesh, India</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Threads Fashion. All rights reserved.</p>
                <div className="footer-legal">
                    <Link to="/privacy">Privacy Policy</Link>
                    <Link to="/terms">Terms of Service</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
