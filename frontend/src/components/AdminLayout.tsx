import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, PanelLeftClose, PanelLeftOpen, Bell } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import Breadcrumb from './Breadcrumb';
import { useAuthContext } from '../context/AuthContext';
import '../styles/admin.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuthContext();
    const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        // Persist collapsed state
        const stored = localStorage.getItem('admin_sidebar_collapsed');
        return stored === 'true';
    });
    const location = useLocation();

    useEffect(() => {
        localStorage.setItem('admin_sidebar_collapsed', String(sidebarCollapsed));
    }, [sidebarCollapsed]);

    // Helper to get title based on current path for the top header
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/admin') return 'Dashboard';
        if (path.includes('/orders')) return 'Order Management';
        if (path.includes('/products')) return 'Product Inventory';
        if (path.includes('/users')) return 'User Management';
        if (path.includes('/audit')) return 'System Audit Logs';
        if (path.includes('/settings')) return 'Settings';
        return 'Admin';
    };

    return (
        <div className="admin-layout">
            <AdminSidebar
                isOpen={sidebarOpen}
                isCollapsed={sidebarCollapsed}
                onClose={() => setSidebarOpen(false)}
            />

            <div className={`admin-main ${sidebarCollapsed ? 'collapsed' : ''}`}>
                {/* Top Header */}
                <header className="admin-top-header">
                    <div className="admin-top-header-content" style={{ justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {/* Mobile Toggle */}
                            <button
                                className="mobile-toggle"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu size={24} />
                            </button>

                            {/* Desktop Toggle */}
                            <button
                                className="desktop-toggle"
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                            >
                                {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                            </button>

                            {/* Title Section */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h2 className="admin-top-header-title text-xl font-bold text-gray-800">
                                    Dashboard
                                </h2>
                                <span className="text-sm text-gray-500">
                                    Welcome back, {user?.firstName || 'Admin'}
                                </span>
                            </div>
                        </div>

                        {/* Right Side Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>

                            {/* Notification Bell */}
                            <button
                                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                                title="Notifications"
                            >
                                <Bell size={20} className="text-gray-600" />
                                <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                            </button>

                            {/* Divider */}
                            <div style={{ width: '1px', height: '32px', background: '#e5e7eb' }}></div>

                            {/* Profile Section */}
                            <div className="admin-header-profile">
                                <div className="hidden md:flex admin-profile-info">
                                    <span className="admin-profile-name">
                                        {user?.firstName || 'Admin'}
                                    </span>
                                    <span className="admin-profile-email">
                                        {user?.email || 'admin@threads.com'}
                                    </span>
                                </div>
                                <a href="/profile" className="admin-profile-avatar-link" title="My Profile">
                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                                        {user?.firstName?.charAt(0) || 'A'}
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                < main className="admin-main-content" >
                    <div className="admin-breadcrumb-wrapper">
                        <Breadcrumb items={[
                            { label: 'Admin', href: '/admin' },
                            ...(location.pathname !== '/admin' ? [{ label: getPageTitle(), href: '#' }] : [])
                        ]} />
                    </div>
                    {children}
                </main >
            </div >
        </div >
    );
}
