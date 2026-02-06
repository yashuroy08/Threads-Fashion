import { useState, useEffect } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import AdminLayout from '../../components/AdminLayout';

export default function AdminAudit() {
    const { user } = useAuthContext();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);
    const [filters, setFilters] = useState({ userId: '', actionType: '' });

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...filters
            });

            const res = await fetch(`/api/v1/admin/audit?${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            // Handle different response structures if route differs, 
            // but we updated admin.controller to return { logs, pagination }
            if (data.logs) {
                setLogs(data.logs);
                setPagination(data.pagination);
            } else {
                setLogs([]);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchLogs();
        }
    }, [user, page]); // Re-fetch on page change

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); // Reset to page 1 on filter
        fetchLogs();
    };

    if (loading && page === 1 && logs.length === 0) return <AdminLayout><div>Loading logs...</div></AdminLayout>;

    return (
        <AdminLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem', fontSize: '1.8rem' }}>System Audit Logs</h1>
                    <p className="secondary-text">Track critical administrative actions and system events.</p>
                </div>
            </div>

            <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e5e7eb' }}>
                <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>User ID</label>
                        <input
                            className="form-input"
                            value={filters.userId}
                            onChange={e => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                            placeholder="Search by User ID"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Action Type</label>
                        <input
                            className="form-input"
                            value={filters.actionType}
                            onChange={e => setFilters(prev => ({ ...prev, actionType: e.target.value }))}
                            placeholder="e.g. ORDER_CANCELLED"
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.2rem' }}>Filter</button>
                </form>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--brand-border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--brand-muted-bg)' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Timestamp</th>
                            <th style={{ padding: '1rem' }}>User ID</th>
                            <th style={{ padding: '1rem' }}>Action</th>
                            <th style={{ padding: '1rem' }}>Description</th>
                            <th style={{ padding: '1rem' }}>IP / Agent</th>
                            <th style={{ padding: '1rem' }}>Metadata</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--brand-text-secondary)' }}>No logs found.</td>
                            </tr>
                        ) : (
                            logs.map((log: any) => (
                                <tr key={log._id} style={{ borderTop: '1px solid var(--brand-border)' }}>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                        {log.userId}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            background: '#f3f4f6',
                                            color: '#374151',
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700
                                        }}>
                                            {log.actionType}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{log.actionDescription}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                        <div>{log.ipAddress}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.userAgent}>
                                            {log.userAgent}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                        {log.metadata ? (
                                            <pre style={{ margin: 0, fontSize: '0.75rem', color: '#666', background: '#f9fafb', padding: '4px', borderRadius: '4px' }}>
                                                {JSON.stringify(log.metadata, null, 1)}
                                            </pre>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {pagination && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
                    <button
                        className="btn-secondary"
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        Previous
                    </button>
                    <span>Page {page} of {pagination.pages}</span>
                    <button
                        className="btn-secondary"
                        disabled={page >= pagination.pages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </AdminLayout>
    );
}
