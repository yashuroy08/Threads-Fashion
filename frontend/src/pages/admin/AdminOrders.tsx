import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useSocket } from '../../context/SocketContext';
import { Trash2 } from 'lucide-react';
import '../../styles/admin.css';

export default function AdminOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

    async function loadOrders() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/orders/admin/list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setOrders(data);
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setLoading(false);
        }
    }

    async function updateStatus(orderId: string, status: string) {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/v1/orders/admin/status/${orderId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            loadOrders();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    }

    async function deleteOrder(orderId: string) {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/orders/admin/${orderId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                loadOrders();
                setShowDeleteConfirm(null);
                // Remove from selection if deleted
                const newSelected = new Set(selectedOrders);
                newSelected.delete(orderId);
                setSelectedOrders(newSelected);
            } else {
                console.error('Failed to delete order');
            }
        } catch (error) {
            console.error('Failed to delete order:', error);
        }
    }

    async function bulkDeleteOrders() {
        if (selectedOrders.size === 0) return;
        setIsBulkDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/orders/admin/bulk-delete', {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orderIds: Array.from(selectedOrders) })
            });

            if (res.ok) {
                loadOrders();
                setSelectedOrders(new Set());
                setShowBulkDeleteConfirm(false);
            } else {
                console.error('Failed to bulk delete orders');
            }
        } catch (error) {
            console.error('Failed to bulk delete orders:', error);
        } finally {
            setIsBulkDeleting(false);
        }
    }

    const toggleSelectAll = () => {
        if (selectedOrders.size === filteredOrders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(filteredOrders.map(o => o.orderId)));
        }
    };

    const toggleSelectOrder = (orderId: string) => {
        const newSelected = new Set(selectedOrders);
        if (newSelected.has(orderId)) {
            newSelected.delete(orderId);
        } else {
            newSelected.add(orderId);
        }
        setSelectedOrders(newSelected);
    };

    const socket = useSocket();

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on('order_update', () => {
            loadOrders();
        });
        return () => {
            socket.off('order_update');
        };
    }, [socket]);

    const [searchParams] = useSearchParams();
    const filterType = searchParams.get('filter');

    const filteredOrders = orders.filter(order => {
        if (!filterType) return true;
        if (filterType === 'return_requested') {
            return ['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_REJECTED', 'EXCHANGE_REQUESTED', 'EXCHANGE_APPROVED', 'EXCHANGE_REJECTED'].includes(order.status);
        }
        if (filterType === 'exchange_requested') {
            return ['EXCHANGE_REQUESTED', 'EXCHANGE_APPROVED', 'EXCHANGE_REJECTED'].includes(order.status);
        }
        if (filterType === 'cancelled') {
            return order.status === 'CANCELLED';
        }
        return true;
    });

    if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;

    return (
        <AdminLayout>
            <header className="admin-header">
                <h2 className="admin-title">
                    {filterType === 'return_requested' ? 'Returns & Exchanges' :
                        filterType === 'exchange_requested' ? 'Exchanges' :
                            filterType === 'cancelled' ? 'Cancellations' : 'Order Management'}
                </h2>
                {selectedOrders.size > 0 && (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            className="btn-secondary"
                            onClick={toggleSelectAll}
                            style={{
                                padding: '0.6rem 1.2rem',
                                whiteSpace: 'nowrap',
                                background: 'transparent',
                                color: '#000',
                                border: '1px solid #000'
                            }}
                        >
                            {selectedOrders.size === filteredOrders.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <button
                            className="btn-delete"
                            onClick={() => setShowBulkDeleteConfirm(true)}
                            style={{
                                padding: '0.6rem 1.2rem',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Trash2 size={18} />
                            <span> ({selectedOrders.size})</span>
                        </button>
                    </div>
                )}
            </header>

            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                {/* Checkbox removed per request */}
                            </th>
                            <th>Order ID</th>
                            <th>User ID</th>
                            <th>Products</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Action Reason</th>
                            <th>Date</th>
                            <th>Actions</th>
                            <th>Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map(order => (
                            <tr key={order.orderId}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.has(order.orderId)}
                                        onChange={() => toggleSelectOrder(order.orderId)}
                                    />
                                </td>
                                <td style={{ fontSize: '0.85rem' }}>{order.orderId}</td>
                                <td style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{order.userId}</td>
                                <td style={{ fontSize: '0.8rem', maxWidth: '200px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {order.items.map((item: any, idx: number) => (
                                            <div key={idx} title={item.productId}>
                                                <span style={{ fontWeight: 600 }}>{item.quantity}x</span> {item.title.substring(0, 20)}...
                                                <div style={{ fontSize: '0.7rem', color: '#666', fontFamily: 'monospace' }}>ID: {item.productId}</div>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td>₹{order.total / 100}</td>
                                <td>
                                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td style={{ maxWidth: '200px', fontSize: '0.85rem' }}>
                                    {order.cancellationReason && (
                                        <div><strong>Cancel:</strong> {order.cancellationReason}</div>
                                    )}
                                    {order.returnReason && (
                                        <div><strong>Return:</strong> {order.returnReason}</div>
                                    )}
                                    {order.exchangeReason && (
                                        <div><strong>Exchange:</strong> {order.exchangeReason}</div>
                                    )}
                                    {!order.cancellationReason && !order.returnReason && !order.exchangeReason && (
                                        <span className="text-muted">-</span>
                                    )}
                                </td>
                                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <select
                                        value={order.status}
                                        onChange={(e) => updateStatus(order.orderId, e.target.value)}
                                        className="admin-status-select"
                                    >
                                        <optgroup label="Standard Status">
                                            <option value="PENDING">Pending</option>
                                            <option value="PAID">Paid</option>
                                            <option value="SHIPPED">Shipped</option>
                                            <option value="DELIVERED">Delivered</option>
                                            <option value="CANCELLED">Cancelled</option>
                                        </optgroup>
                                        {(order.status === 'DELIVERED' || order.status.startsWith('RETURN_') || order.status.startsWith('EXCHANGE_')) && (
                                            <optgroup label="Return & Exchange">
                                                <option value="RETURN_REQUESTED">Return Requested</option>
                                                <option value="RETURN_APPROVED">Return Approved</option>
                                                <option value="RETURN_REJECTED">Return Rejected</option>
                                                <option value="EXCHANGE_REQUESTED">Exchange Requested</option>
                                                <option value="EXCHANGE_APPROVED">Exchange Approved</option>
                                                <option value="EXCHANGE_REJECTED">Exchange Rejected</option>
                                            </optgroup>
                                        )}
                                    </select>
                                </td>
                                <td>
                                    <button
                                        className="btn-delete"
                                        onClick={() => setShowDeleteConfirm(order.orderId)}
                                        style={{
                                            padding: '0.4rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: '#dc2626',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                        title="Delete Order"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '12px',
                        maxWidth: '450px',
                        width: '90%',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                    }}>
                        <h3 style={{ marginBottom: '1rem', color: '#dc2626' }}>⚠️ Delete Order</h3>
                        <p style={{ marginBottom: '1.5rem', color: '#666' }}>
                            Are you sure you want to delete order <strong>{showDeleteConfirm}</strong>?
                            This action cannot be undone and will permanently remove the order from history.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                style={{
                                    padding: '0.6rem 1.5rem',
                                    background: '#e5e7eb',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteOrder(showDeleteConfirm)}
                                style={{
                                    padding: '0.6rem 1.5rem',
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Delete Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirmation Modal */}
            {showBulkDeleteConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '12px',
                        maxWidth: '450px',
                        width: '90%',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                    }}>
                        <h3 style={{ marginBottom: '1rem', color: '#dc2626' }}>⚠️ Bulk Delete Orders</h3>
                        <p style={{ marginBottom: '1.5rem', color: '#666' }}>
                            Are you sure you want to delete <strong>{selectedOrders.size}</strong> selected orders?
                            This action cannot be undone and will permanently remove these orders from history.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowBulkDeleteConfirm(false)}
                                disabled={isBulkDeleting}
                                style={{
                                    padding: '0.6rem 1.5rem',
                                    background: '#e5e7eb',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={bulkDeleteOrders}
                                disabled={isBulkDeleting}
                                style={{
                                    padding: '0.6rem 1.5rem',
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    opacity: isBulkDeleting ? 0.7 : 1
                                }}
                            >
                                {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
