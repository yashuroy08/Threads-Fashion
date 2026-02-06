import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import '../../styles/admin.css';
import { useNotification } from '../../context/NotificationContext';

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { notify } = useNotification();

    async function loadUsers() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/profile/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleEditUser(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/v1/profile/admin/users/${editingUser._id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            setIsModalOpen(false);
            setEditingUser(null);
            loadUsers();
        } catch (error) {
            console.error('Failed to update user:', error);
            notify('Failed to update user', 'error');
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;

    return (
        <AdminLayout>
            <header className="admin-header">
                <h2 className="admin-title">User Management</h2>
            </header>

            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td>{user.firstName} {user.lastName}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`status-badge ${user.role === 'admin' ? 'status-active' : ''}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button
                                        className="btn-outline"
                                        onClick={() => {
                                            setEditingUser(user);
                                            setIsModalOpen(true);
                                        }}
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && editingUser && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Edit User</h3>
                        <form onSubmit={handleEditUser} className="admin-form">
                            <div className="form-group">
                                <label>First Name</label>
                                <input name="firstName" defaultValue={editingUser.firstName} required className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input name="lastName" defaultValue={editingUser.lastName} required className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input name="phoneNumber" defaultValue={editingUser.phoneNumber} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select name="role" defaultValue={editingUser.role} className="form-input">
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn-update">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
