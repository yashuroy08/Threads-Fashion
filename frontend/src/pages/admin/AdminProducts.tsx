import { useEffect, useState } from 'react';
import {
    fetchAdminProducts,
    toggleProduct,
} from '../../services/adminProducts.api';
import AdminProductForm from './AdminProductForm';
import AdminLayout from '../../components/AdminLayout';
// 
import { TableSkeleton } from '../../components/SkeletonLoader';

import { useNotification } from '../../context/NotificationContext';

export default function AdminProducts() {
    const [products, setProducts] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const { notify } = useNotification();

    async function load() {
        setLoading(true);
        try {
            const data = await fetchAdminProducts();
            setProducts(data.items);
        } catch (error) {
            console.error('Failed to load products', error);
            notify('Failed to load products', 'error');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const handleAdd = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product: any) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        load();
    };

    // Page Transition View
    if (isModalOpen) {
        return (
            <AdminLayout>
                <div className="reveal">
                    <AdminProductForm
                        product={editingProduct}
                        onDone={handleClose}
                    />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-header-aura reveal">

                <header className="admin-header">
                    <h2 className="admin-title">Product Management</h2>
                    <button className="btn-add" onClick={handleAdd}>
                        Add Product
                    </button>
                </header>
            </div>

            {loading ? (
                <TableSkeleton />
            ) : (
                <div className="table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>Image</th>
                                <th>Title</th>
                                <th>Price</th>
                                <th style={{ whiteSpace: 'nowrap' }}>Inventory (T/R/A)</th>
                                <th>Status</th>
                                <th style={{ width: '1%', whiteSpace: 'nowrap' }}>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {products.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '6px',
                                            overflow: 'hidden',
                                            background: '#f3f4f6',
                                            border: '1px solid #e5e7eb',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {p.images && p.images[0]?.url ? (
                                                <img
                                                    src={p.images[0].url}
                                                    alt=""
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>N/A</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{p.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--brand-text-secondary)' }}>
                                            {p.slug}
                                        </div>
                                    </td>
                                    <td>₹{p.price.amount / 100}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>
                                            <span title="Total Stock">T: {p.stock}</span>
                                            <span style={{ color: 'var(--brand-text-secondary)' }} title="Reserved">R: {p.reservedStock || 0}</span>
                                            <span style={{ fontWeight: 700, color: (p.stock - (p.reservedStock || 0)) <= 0 ? 'var(--brand-danger)' : 'var(--brand-success)' }} title="Available">
                                                A: {p.stock - (p.reservedStock || 0)}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${p.isActive ? 'status-active' : 'status-inactive'}`}>
                                            {p.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn-outline" onClick={() => handleEdit(p)}>
                                                Edit
                                            </button>
                                            <button
                                                className={p.isActive ? 'btn-danger' : 'btn-success'}
                                                onClick={async () => {
                                                    try {
                                                        await toggleProduct(p.id, p.isActive);
                                                        notify(`Product ${p.isActive ? 'deactivated' : 'reactivated'} successfully`, 'success');
                                                        load();
                                                    } catch (error) {
                                                        notify('Failed to update product status', 'error');
                                                    }
                                                }}
                                            >
                                                {p.isActive ? 'Deactivate' : 'Reactivate'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminLayout>
    );
}
