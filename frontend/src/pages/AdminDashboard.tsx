import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Package, Users, ArrowRight, ScrollText } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import { useSocket } from '../context/SocketContext';

import '../styles/admin.css';

export default function AdminDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const socket = useSocket();

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch admin stats', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('order_update', () => {
            fetchStats();
        });

        return () => {
            socket.off('order_update');
        };
    }, [socket]);

    if (loading) return <AdminLayout><DashboardSkeleton /></AdminLayout>;

    return (
        <AdminLayout>
            <div className="admin-header-aura reveal">

                <header className="admin-header">
                    <h2 className="admin-title">System Overview</h2>
                </header>
            </div>

            {/* Live Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <p className="stat-label">Revenue</p>
                    <h2 className="stat-value">₹{(data.stats.revenue / 100).toLocaleString()}</h2>
                </div>
                <div className="stat-card">
                    <p className="stat-label">Orders</p>
                    <h2 className="stat-value">{data.stats.orders}</h2>
                </div>
                <div className="stat-card">
                    <p className="stat-label">Products</p>
                    <h2 className="stat-value">{data.stats.products}</h2>
                </div>
                <div className="stat-card">
                    <p className="stat-label">Users</p>
                    <h2 className="stat-value">{data.stats.users}</h2>
                </div>
            </div>

            <div className="dashboard-content-grid">
                {/* Recent Orders */}
                <div className="recent-orders-card">
                    <h3>Recent Orders</h3>
                    {data.latestOrders.length === 0 ? (
                        <p className="secondary-text">No orders yet.</p>
                    ) : (
                        <div className="orders-list">
                            {data.latestOrders.map((order: any) => (
                                <div key={order._id} className="order-list-item">
                                    <div className="order-list-left">
                                        <div className="order-id-text">{order.orderId}</div>
                                        <div className="order-date-text">{new Date(order.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div className="order-list-right">
                                        <div className="order-total-text">₹{order.total / 100}</div>
                                        <div className="order-status-text">{order.status}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <Link to="/admin/orders" className="view-all-link">
                        View All Orders <ArrowRight size={14} />
                    </Link>
                </div>

                {/* Quick Actions */}
                <div className="action-grid">
                    <Link to="/admin/products" className="action-card">
                        <Package size={32} color="var(--admin-primary)" />
                        <h4>Products</h4>
                    </Link>
                    <Link to="/admin/users" className="action-card">
                        <Users size={32} color="var(--admin-primary)" />
                        <h4>Users</h4>
                    </Link>
                    <Link to="/admin/audit" className="action-card">
                        <ScrollText size={32} color="var(--admin-primary)" />
                        <h4>Audit Logs</h4>
                    </Link>
                    <div className="version-card">
                        <img src="/assets/logo.png" alt="Threads Fashion" />
                        <h4>v1.0.4</h4>
                    </div>
                </div>
            </div>
        </AdminLayout >
    );
}
