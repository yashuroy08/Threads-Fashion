import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    RotateCcw,
    XCircle,
    ScrollText,
    Settings,
    LogOut,
    Store,

} from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { useSocket } from '../context/SocketContext';
import { useNotification } from '../context/NotificationContext';
import '../styles/admin.css';

interface AdminSidebarProps {
    isOpen: boolean; // Mobile open state
    isCollapsed: boolean; // Desktop collapsed state
    onClose: () => void;
}

export default function AdminSidebar({ isOpen, isCollapsed, onClose }: AdminSidebarProps) {
    const location = useLocation();

    // Helper to determine active state
    const isActive = (path: string, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    const [counts, setCounts] = useState({ activeOrders: 0, returns: 0, exchanges: 0, cancellations: 0 });

    const socket = useSocket();
    const { notify } = useNotification();

    const fetchCounts = () => {
        const token = localStorage.getItem('token');
        fetch('/api/v1/admin/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data?.stats) {
                    setCounts(data.stats);
                }
            })
            .catch(err => console.error('Failed to load sidebar stats', err));
    };

    useEffect(() => {
        fetchCounts();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('order_update', (order: any) => {
            // Refresh counts immediately
            fetchCounts();

            // Show toast notification
            if (['PENDING', 'PLACED'].includes(order.status)) {
                notify(`New Order Received: #${order.orderId}`, 'success');
            } else {
                notify(`Order #${order.orderId} updated: ${order.status}`, 'info');
            }
        });

        return () => {
            socket.off('order_update');
        };
    }, [socket, notify]);

    const NavGroup = ({ label }: { label?: string }) => (
        (!isCollapsed && label) ? <div className="nav-section-label">{label}</div> : <div style={{ height: '10px' }}></div>
    );

    const NavItem = ({ to, icon: Icon, label, exact = false, count }: any) => {
        const active = isActive(to, exact);
        return (
            <Link
                to={to}
                className={`nav-item ${active ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`}
                onClick={onClose} // Only affects mobile
                data-tooltip-id="sidebar-tooltip"
                data-tooltip-content={isCollapsed ? label : ""}
            >
                <Icon size={20} />
                {!isCollapsed ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{label}</span>
                        {count > 0 && <span className="sidebar-badge">{count}</span>}
                    </div>
                ) : (
                    <>
                        {count > 0 && <span className="sidebar-badge collapsed">{count}</span>}
                    </>
                )}
            </Link>
        );
    }

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside className={`admin-sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header" style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                    {isCollapsed ? (
                        <img src="/assets/logo.png" style={{ height: '24px', width: '24px', objectFit: 'cover', borderRadius: '4px' }} alt="TF" />
                    ) : (
                        <img src="/assets/logo.png" alt="Threads Fashion" style={{ height: '32px', objectFit: 'contain' }} />
                    )}
                </div>

                <nav className="sidebar-nav">
                    <NavGroup label="Overview" />
                    <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" exact />

                    <NavGroup label="Management" />
                    <NavItem to="/admin/orders" icon={ShoppingCart} label="Orders" count={counts.activeOrders} />
                    <NavItem to="/admin/products" icon={Package} label="Products" />
                    <NavItem to="/admin/users" icon={Users} label="Users" />

                    <NavGroup label="Requests" />
                    <Link
                        to="/admin/orders?filter=return_requested"
                        className={`nav-item ${location.search.includes('return') ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`}
                        onClick={onClose}
                        data-tooltip-id="sidebar-tooltip"
                        data-tooltip-content={isCollapsed ? "Returns / Exchanges" : ""}
                    >
                        <RotateCcw size={20} />
                        {!isCollapsed ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>Returns / Exchanges</span>
                                {(counts.returns + counts.exchanges) > 0 && (
                                    <span className="sidebar-badge">{counts.returns + counts.exchanges}</span>
                                )}
                            </div>
                        ) : (
                            <>
                                {(counts.returns + counts.exchanges) > 0 && (
                                    <span className="sidebar-badge collapsed">{counts.returns + counts.exchanges}</span>
                                )}
                            </>
                        )}
                    </Link>
                    <Link
                        to="/admin/orders?filter=cancelled"
                        className={`nav-item ${location.search.includes('cancelled') ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`}
                        onClick={onClose}
                        data-tooltip-id="sidebar-tooltip"
                        data-tooltip-content={isCollapsed ? "Cancellations" : ""}
                    >
                        <XCircle size={20} />
                        {!isCollapsed ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>Cancellations</span>
                                {counts.cancellations > 0 && <span className="sidebar-badge">{counts.cancellations}</span>}
                            </div>
                        ) : (
                            <>
                                {counts.cancellations > 0 && <span className="sidebar-badge collapsed">{counts.cancellations}</span>}
                            </>
                        )}
                    </Link>

                    <NavGroup label="System" />

                    <NavItem to="/admin/audit" icon={ScrollText} label="Audit Logs" />
                    <NavItem to="/admin/settings" icon={Settings} label="Settings" />
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Link
                        to="/"
                        className={`nav-item ${isCollapsed ? 'collapsed' : ''}`}
                        style={{ marginBottom: '0.5rem' }}
                        data-tooltip-id="sidebar-tooltip"
                        data-tooltip-content={isCollapsed ? "View Shop" : ""}
                    >
                        <Store size={20} />
                        {!isCollapsed && <span>View Shop</span>}
                    </Link>
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            window.location.href = '/login';
                        }}
                        className={`nav-item ${isCollapsed ? 'collapsed' : ''}`}
                        style={{
                            width: '100%',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444'
                        }}
                        data-tooltip-id="sidebar-tooltip"
                        data-tooltip-content={isCollapsed ? "Logout" : ""}
                    >
                        <LogOut size={20} />
                        {!isCollapsed && <span>Logout</span>}
                    </button>
                    {!isCollapsed && (
                        <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: '#6b7280', textAlign: 'center' }}>
                            v1.1.0
                        </div>
                    )}
                </div>
                <Tooltip id="sidebar-tooltip" place="right" className="admin-sidebar-tooltip" style={{ zIndex: 60 }} />
            </aside>
        </>
    );
}
