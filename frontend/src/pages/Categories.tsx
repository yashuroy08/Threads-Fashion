import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shirt, Footprints, Watch, Glasses, ShoppingBag, Scissors, Briefcase, Menu, X } from 'lucide-react';
import '../styles/categories.css';
import { API_BASE } from '../config/api.config';

const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('shirt') || lower.includes('top') || lower.includes('hoodie')) return <Shirt size={32} strokeWidth={1} />;
    if (lower.includes('shoe') || lower.includes('sneaker') || lower.includes('boot')) return <Footprints size={32} strokeWidth={1} />;
    if (lower.includes('jean') || lower.includes('pant') || lower.includes('trouser')) return <Scissors size={32} strokeWidth={1} />;
    if (lower.includes('watch')) return <Watch size={32} strokeWidth={1} />;
    if (lower.includes('glass')) return <Glasses size={32} strokeWidth={1} />;
    if (lower.includes('bag') || lower.includes('backpack')) return <Briefcase size={32} strokeWidth={1} />;
    return <ShoppingBag size={32} strokeWidth={1} />;
};


export default function Categories() {
    const [categories, setCategories] = useState<{ parents: any[], childrenMap: Record<string, any[]> }>({ parents: [], childrenMap: {} });
    const [selectedParent, setSelectedParent] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE}/categories`)
            .then(res => res.json())
            .then(data => {
                const allCats = Array.isArray(data) ? data : [];
                const parents = allCats.filter((c: any) => !c.parentId);
                const childrenMap: Record<string, any[]> = {};

                parents.forEach((p: any) => {
                    const pid = p._id || p.id;
                    childrenMap[pid] = allCats.filter((c: any) => c.parentId === pid);
                });

                setCategories({ parents, childrenMap });
                if (parents.length > 0) {
                    setSelectedParent(parents[0]._id || parents[0].id);
                }
            })
            .catch(err => console.error(err));
    }, []);

    const activeParent = categories.parents.find(p => (p._id || p.id) === selectedParent);

    return (
        <div className="categories-page">
            {/* Sidebar (Parents) */}
            {/* Mobile Sidebar Overlay */}
            <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)} />

            {/* Sidebar (Parents) */}
            <div className={`categories-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="mobile-sidebar-header">
                    <span className="sidebar-title">Categories</span>
                    <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>
                {categories.parents.map((parent, index) => (
                    <div
                        key={parent._id || parent.id || index}
                        onClick={() => {
                            const pid = parent._id || parent.id;
                            setSelectedParent(pid);
                            setIsSidebarOpen(false);
                        }}
                        className={`category-parent-item ${(selectedParent === parent._id || selectedParent === parent.id) ? 'active' : ''}`}
                    >
                        {(selectedParent === parent._id || selectedParent === parent.id) && <div className="active-indicator" />}
                        {parent.name}
                    </div>
                ))}
            </div>

            {/* Content (Children) */}
            <div className="categories-content">
                {selectedParent && (
                    <div>
                        {/* Header */}
                        <div className="category-header">
                            <h2 className="category-title">
                                {activeParent?.name}
                            </h2>
                            <Link
                                to={`/products?parentCategory=${activeParent?.slug}`}
                                className="view-all-link"
                            >
                                View All
                            </Link>
                        </div>

                        {/* Mobile Category Tray (Horizontal Scroll) */}
                        <div className="mobile-category-tray">
                            {categories.parents.map((parent) => (
                                <button
                                    key={parent._id || parent.id}
                                    onClick={() => setSelectedParent(parent._id || parent.id)}
                                    className={`tray-item ${(selectedParent === parent._id || selectedParent === parent.id) ? 'active' : ''}`}
                                >
                                    {parent.name}
                                </button>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="categories-grid">
                            {/* "All" Item */}
                            <Link
                                to={`/products?parentCategory=${activeParent?.slug}`}
                                className="category-child-item"
                            >
                                <div className="category-circle" style={{ color: '#111827', borderWidth: '1px' }}>
                                    <span style={{ fontSize: '1.2rem', fontWeight: '500' }}>All</span>
                                </div>
                                <span className="category-child-label">
                                    All {activeParent?.name}
                                </span>
                            </Link>

                            {/* Subcategories */}
                            {(categories.childrenMap?.[selectedParent] || []).map((child: any, idx: number) => (
                                <Link
                                    key={child._id || child.id || `child-${idx}`}
                                    to={`/products?childCategory=${child.slug}`}
                                    className="category-child-item"
                                >
                                    <div className="category-circle">
                                        {/* Image or Icon */}
                                        {child.image ? (
                                            <img src={child.image} alt={child.name} />
                                        ) : (
                                            getCategoryIcon(child.name)
                                        )}
                                    </div>
                                    <span className="category-child-label">
                                        {child.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
