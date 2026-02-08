import React, { useEffect, useState } from 'react';
import { Save, AlertTriangle, MapPin, AlertCircle } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useSocket } from '../../context/SocketContext';
import { useNotification } from '../../context/NotificationContext';
import { API_BASE } from '../../config/api.config';
import '../../styles/admin.css';

interface AdminSettings {
    storeName: string;
    supportEmail: string;
    supportPhone: string;
    orderCancelWindowHours: number;
    returnWindowDays: number;
    exchangeWindowDays: number;
    maintenanceMode: boolean;
    warehouseZipCode: string;
}

export default function AdminSettings() {
    const [settings, setSettings] = useState<AdminSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [zipLoading, setZipLoading] = useState(false);
    const [zipInfo, setZipInfo] = useState('');

    const { notify } = useNotification();
    const socket = useSocket();

    useEffect(() => {
        fetchSettings();

        if (socket) {
            socket.on('SETTINGS_UPDATED', (updatedSettings: AdminSettings) => {
                setSettings(updatedSettings);
                notify('Settings updated by another admin', 'info');
            });
        }

        return () => {
            if (socket) {
                socket.off('SETTINGS_UPDATED');
            }
        };
    }, [socket]);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/admin/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSettings(data);
        } catch (error) {
            console.error('Failed to fetch settings', error);
            notify('Failed to load settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/admin/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (!res.ok) throw new Error('Failed to update');

            notify('Settings updated successfully!', 'success');

            const updated = await res.json();
            setSettings(updated);
        } catch (error) {
            notify('Failed to update settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const verifyWarehousePincode = async (code: string) => {
        if (!/^\d{6}$/.test(code)) return;
        setZipLoading(true);
        setZipInfo('');
        try {
            const res = await fetch(`https://api.postalpincode.in/pincode/${code}`);
            const data = await res.json();
            if (data[0].Status === "Success") {
                const details = data[0].PostOffice[0];
                setZipInfo(`${details.District}, ${details.State}`);
            } else {
                setZipInfo('Invalid ZIP Code');
            }
        } catch (err) {
            console.error('Pincode API failed', err);
        } finally {
            setZipLoading(false);
        }
    };

    const handleChange = (field: keyof AdminSettings, value: any) => {
        if (!settings) return;
        setSettings({ ...settings, [field]: value });
    };

    if (loading) return (
        <AdminLayout>
            <div className="reveal">Loading Settings...</div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="admin-header-aura reveal">
                <header className="admin-header">
                    <div>
                        <h2 className="admin-title">Store Settings</h2>
                        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Configuration updates apply immediately to the store.</p>
                    </div>
                    {settings?.maintenanceMode && (
                        <div style={{ padding: '0.5rem 1rem', background: '#FEF2F2', color: '#991B1B', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #FECACA' }}>
                            <AlertTriangle size={16} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Maintenance Mode Active</span>
                        </div>
                    )}
                </header>
            </div>



            <form onSubmit={handleSave} className="reveal">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                    {/* General Settings */}
                    <div className="admin-card">
                        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>General Information</h3>

                        <div className="form-group">
                            <label>Store Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={settings?.storeName}
                                onChange={(e) => handleChange('storeName', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Support Email</label>
                            <input
                                type="email"
                                className="form-input"
                                value={settings?.supportEmail}
                                onChange={(e) => handleChange('supportEmail', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Support Phone</label>
                            <input
                                type="text"
                                className="form-input"
                                value={settings?.supportPhone}
                                onChange={(e) => handleChange('supportPhone', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Default Warehouse ZIP Code (Fallback)</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={settings?.warehouseZipCode}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        handleChange('warehouseZipCode', val);
                                        if (val.length === 6) verifyWarehousePincode(val);
                                    }}
                                    maxLength={6}
                                    placeholder="e.g. 110001"
                                    style={{ paddingRight: '40px' }}
                                />
                                {zipLoading && (
                                    <div className="zip-spinner" style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '18px',
                                        height: '18px',
                                        border: '2px solid #f3f3f3',
                                        borderTop: '2px solid #000',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }} />
                                )}
                            </div>
                            {zipInfo && (
                                <small style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    marginTop: '0.5rem',
                                    color: zipInfo.includes('Invalid') ? '#ef4444' : '#10b981',
                                    fontWeight: 600,
                                    fontSize: '0.8rem'
                                }}>
                                    {zipInfo.includes('Invalid') ? <AlertCircle size={14} /> : <MapPin size={14} />}
                                    {zipInfo}
                                </small>
                            )}
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>Global pickup location used for distance calculations if product-specific location is missing.</p>
                        </div>
                    </div>

                    {/* Rules & Logic */}
                    <div className="admin-card">
                        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Business Rules</h3>

                        <div className="form-group">
                            <label>Order Cancellation Window (Hours)</label>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>Time after order placement where users can self-cancel.</p>
                            <input
                                type="number"
                                className="form-input"
                                value={settings?.orderCancelWindowHours}
                                onChange={(e) => handleChange('orderCancelWindowHours', Number(e.target.value))}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Return Window (Days)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={settings?.returnWindowDays}
                                    onChange={(e) => handleChange('returnWindowDays', Number(e.target.value))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Exchange Window (Days)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={settings?.exchangeWindowDays}
                                    onChange={(e) => handleChange('exchangeWindowDays', Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                id="maintenance"
                                style={{ width: '1.2rem', height: '1.2rem' }}
                                checked={settings?.maintenanceMode}
                                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                            />
                            <label htmlFor="maintenance" style={{ margin: 0, fontWeight: 600 }}>Enable Maintenance Mode</label>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#ef4444', marginLeft: '1.8rem' }}>
                            Warning: Enabling this will prevent checkout for all users.
                        </p>
                    </div>
                </div>

                <div className="form-actions" style={{ marginTop: '2rem' }}>
                    <button type="button" className="btn-secondary" onClick={fetchSettings}>Discard Changes</button>
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Save size={18} /> Save Settings
                            </span>
                        )}
                    </button>
                </div>
            </form>
        </AdminLayout>
    );
}
