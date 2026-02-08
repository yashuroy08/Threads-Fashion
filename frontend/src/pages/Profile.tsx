import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useCartContext } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { useDebounce } from '../hooks/useDebounce';
import { DashboardSkeleton } from '../components/SkeletonLoader';

import ReasonModal from '../components/ReasonModal';
import { OrderApi } from '../api/orders.api';
import {
    User,
    Package,
    HelpCircle,
    LogOut,
    Mail,
    Phone,
    ChevronRight,
    ChevronDown,
    MessageCircle,
    Truck,
    RotateCcw,
    X,
    CheckCircle2,
    Trash2,
    Pencil,
    MapPin
} from 'lucide-react';
import '../styles/profile.css'
import '../styles/auth.css';

// --- Helper Functions ---
function getUserInitials(firstName?: string, lastName?: string, email?: string): string {
    if (firstName && lastName) {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
        return firstName.substring(0, 2).toUpperCase();
    }
    if (email) {
        return email.substring(0, 2).toUpperCase();
    }
    return 'U';
}

// --- Types & Interfaces ---
type UserProfile = {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    isPhoneVerified?: boolean;
    gender?: 'male' | 'female' | 'other';
    addresses: Array<{
        street: string;
        city: string;
        state: string;
        zipCode: string;
        addressType: 'default' | 'primary' | 'secondary';
    }>;
};

type StoreSettings = {
    storeName: string;
    supportEmail: string;
    supportPhone: string;
    orderCancelWindowHours: number;
    returnWindowDays: number;
    exchangeWindowDays: number;
    maintenanceMode: boolean;
};

// --- State Management ---
interface ProfileState {
    activeTab: 'profile' | 'orders' | 'help';
    profile: UserProfile | null;
    orders: any[];
    settings: StoreSettings | null;
    loading: boolean;
    error: string | null;
    success: string | null;
    orderSuccess: string | null;
    orderError: string | null;
    updating: boolean;
    pincodeLoading: boolean;
    modals: {
        cancel: boolean;
        return: boolean;
        exchange: boolean;
        verifyPhone: boolean;
        editAddress: boolean; // New Modal State
        selectedOrderId: string | null;
    };
    editingAddress: { // New Editing State
        street: string;
        city: string;
        state: string;
        zipCode: string;
        addressType: string;
    } | null;
    expandedHelp: string | null;
    supportStatus: 'online' | 'offline';
}

type ProfileAction =
    | { type: 'SET_TAB'; payload: 'profile' | 'orders' | 'help' }
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; payload: { profile: UserProfile; orders: any[]; settings?: StoreSettings } }
    | { type: 'FETCH_ERROR'; payload: string }
    | { type: 'UPDATE_START' }
    | { type: 'UPDATE_SUCCESS'; payload: string }
    | { type: 'UPDATE_ERROR'; payload: string }
    | { type: 'UPDATE_LOCAL_PROFILE'; payload: Partial<UserProfile> }
    | { type: 'CLEAR_MESSAGES' }
    | { type: 'SET_ORDERS'; payload: any[] }
    | { type: 'ORDER_ACTION_SUCCESS'; payload: { message: string; updatedOrder: any } }
    | { type: 'ORDER_ACTION_ERROR'; payload: string }
    | { type: 'SET_PINCODE_LOADING'; payload: boolean }
    | { type: 'OPEN_MODAL'; payload: { type: 'cancel' | 'return' | 'exchange' | 'verifyPhone'; orderId?: string | null } }
    | { type: 'CLOSE_MODAL' }
    | { type: 'TOGGLE_HELP'; payload: string }
    | { type: 'TOGGLE_HELP'; payload: string }
    | { type: 'SET_SUPPORT_STATUS'; payload: 'online' | 'offline' }
    | { type: 'OPEN_EDIT_ADDRESS'; payload: any }
    | { type: 'CLOSE_EDIT_ADDRESS' };

const initialState: ProfileState = {
    activeTab: 'profile',
    profile: null,
    orders: [],
    settings: null,
    loading: true,
    error: null,
    success: null,
    orderSuccess: null,
    orderError: null,
    updating: false,
    modals: {
        cancel: false,
        return: false,
        exchange: false,
        verifyPhone: false,
        editAddress: false,
        selectedOrderId: null,
    },

    editingAddress: null, // Init
    expandedHelp: null,
    supportStatus: 'online',
    pincodeLoading: false
};

function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
    switch (action.type) {
        case 'SET_TAB':
            return { ...state, activeTab: action.payload };
        case 'FETCH_START':
            return { ...state, loading: true, error: null };
        case 'FETCH_SUCCESS':
            return {
                ...state,
                loading: false,
                profile: action.payload.profile,
                orders: action.payload.orders,
                settings: action.payload.settings || state.settings
            };
        case 'FETCH_ERROR':
            return { ...state, loading: false, error: action.payload };
        case 'UPDATE_START':
            return { ...state, updating: true, success: null, error: null };
        case 'UPDATE_SUCCESS':
            return { ...state, updating: false, success: action.payload };
        case 'UPDATE_ERROR':
            return { ...state, updating: false, error: action.payload };
        case 'UPDATE_LOCAL_PROFILE':
            return { ...state, profile: state.profile ? { ...state.profile, ...action.payload } : null };
        case 'CLEAR_MESSAGES':
            return { ...state, success: null, error: null, orderSuccess: null, orderError: null };
        case 'SET_ORDERS':
            return { ...state, orders: action.payload };
        case 'ORDER_ACTION_SUCCESS':
            return {
                ...state,
                orderSuccess: action.payload.message,
                orders: state.orders.map(o => o.orderId === action.payload.updatedOrder.orderId ? action.payload.updatedOrder : o),
                modals: { ...state.modals, cancel: false, return: false, exchange: false, selectedOrderId: null }
            };
        case 'ORDER_ACTION_ERROR':
            return { ...state, orderError: action.payload };
        case 'OPEN_MODAL':
            return { ...state, modals: { ...state.modals, [action.payload.type]: true, selectedOrderId: action.payload.orderId || null } };
        case 'CLOSE_MODAL':
            return {
                ...state, modals: {
                    cancel: false, return: false, exchange: false, verifyPhone: false, selectedOrderId: null,
                    editAddress: false
                }
            };
        case 'TOGGLE_HELP':
            return { ...state, expandedHelp: state.expandedHelp === action.payload ? null : action.payload };
        case 'SET_SUPPORT_STATUS':
            return { ...state, supportStatus: action.payload };
        case 'OPEN_EDIT_ADDRESS':
            return { ...state, modals: { ...state.modals, editAddress: true }, editingAddress: action.payload };
        case 'CLOSE_EDIT_ADDRESS':
            return { ...state, modals: { ...state.modals, editAddress: false }, editingAddress: null };
        case 'SET_PINCODE_LOADING':
            return { ...state, pincodeLoading: action.payload };

        default:
            return state;
    }
}

// --- Custom Components ---
const CustomSelect = ({
    options,
    value,
    onChange,
    placeholder,
    icon: Icon
}: {
    options: { value: string; label: string }[];
    value?: string;
    onChange: (val: string) => void;
    placeholder: string;
    icon: any;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(o => o.value === value)?.label || value;

    return (
        <div className="custom-select-container" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    cursor: 'pointer',
                    userSelect: 'none'
                }}
            >
                <Icon size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', zIndex: 10 }} />
                <div
                    className="form-input-bold"
                    style={{
                        paddingLeft: '3rem',
                        paddingRight: '2.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'white',
                        minHeight: '48px', // Match input height
                        color: value ? '#111827' : '#9ca3af'
                    }}
                >
                    <span>{selectedLabel || placeholder}</span>
                    <ChevronDown size={18} color="#6b7280" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </div>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    zIndex: 50,
                    overflow: 'hidden',
                    maxHeight: '200px',
                    overflowY: 'auto'
                }}>
                    <div
                        onClick={() => { onChange(''); setIsOpen(false); }}
                        style={{
                            padding: '10px 16px',
                            cursor: 'pointer',
                            color: '#9ca3af',
                            borderBottom: '1px solid #f3f4f6',
                            fontSize: '0.9rem'
                        }}
                    >
                        {placeholder}
                    </div>
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => { onChange(option.value); setIsOpen(false); }}
                            className="custom-option"
                            style={{
                                padding: '10px 16px',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                                color: value === option.value ? '#2563eb' : '#374151',
                                background: value === option.value ? '#eff6ff' : 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.95rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = value === option.value ? '#eff6ff' : '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.background = value === option.value ? '#eff6ff' : 'white'}
                        >
                            {option.label}
                            {value === option.value && <CheckCircle2 size={16} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
// --- End Custom Components ---

function Profile() {
    const { logout } = useAuthContext();
    const { addToCart } = useCartContext();
    const { notify } = useNotification();
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(profileReducer, initialState);
    const [localFormData, setLocalFormData] = useState<any>(null);
    const debouncedPayload = useDebounce(localFormData, 1000);
    const isInitialMount = useRef(true);
    const formRef = useRef<HTMLFormElement>(null);



    // Gender State for Custom Dropdown
    const [gender, setGender] = useState<string>('');

    // Local state for name fields
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');

    // Track selected address for radio buttons
    const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);

    // Sync gender state when profile loads
    useEffect(() => {

        if (state.profile?.gender) {
            setGender(state.profile.gender);
        }

        // Sync name fields
        if (state.profile?.firstName) {
            setFirstName(state.profile.firstName);
        }
        if (state.profile?.lastName) {
            setLastName(state.profile.lastName);
        }

        // Auto-fix malformed phone numbers (e.g. missing +91)
        if (state.profile?.phoneNumber) {
            const phone = state.profile.phoneNumber;
            const digits = phone.replace(/\\D/g, '');
            // If it has 10 digits but doesn't start with +91, fix it
            if (digits.length === 10 && phone !== `+91${digits}`) {
                // We must ensure we don't cause an infinite loop. 
                // autoSaveProfile updates state.profile.
                // This matches only if prefix is WRONG. 
                // Once saved, it will be +91... and this won't trigger.
                autoSaveProfile({ phoneNumber: `+91${digits}` });
                // Update local state immediately to reflect in UI
                dispatch({ type: 'UPDATE_LOCAL_PROFILE', payload: { phoneNumber: `+91${digits}` } });
            }
        }
    }, [state.profile?.gender, state.profile?.phoneNumber, state.profile?.firstName, state.profile?.lastName]);

    // Handle URL query parameters for tab navigation
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const tab = searchParams.get('tab');
        if (tab && (tab === 'profile' || tab === 'orders' || tab === 'help')) {
            dispatch({ type: 'SET_TAB', payload: tab as any });
        }
    }, []);

    // Initial Load
    useEffect(() => {
        loadAllData();
        // Simulate real-time support status check
        const checkSupport = setInterval(() => {
            // Mock status: online 9-5, etc. For now, keep it mostly online.
            dispatch({ type: 'SET_SUPPORT_STATUS', payload: 'online' });
        }, 10000);
        return () => clearInterval(checkSupport);
    }, []);

    // Message Clearing
    useEffect(() => {
        if (state.success || state.orderSuccess || state.error || state.orderError) {
            // If it's the specific "already registered" error, do NOT auto-clear it.
            // It should only clear when the user fixes it (handleFormChange).
            if (state.error && state.error.includes('already registered')) {
                return;
            }
            const timer = setTimeout(() => dispatch({ type: 'CLEAR_MESSAGES' }), 4000);
            return () => clearTimeout(timer);
        }
    }, [state.success, state.orderSuccess, state.error, state.orderError]);

    // Update form data when gender changes
    useEffect(() => {
        if (!isInitialMount.current && formRef.current) {
            // Manually trigger form change logic since hidden input change doesn't bubble React event
            // Create a synthetic event object
            const syntheticEvent = { currentTarget: formRef.current } as React.FormEvent<HTMLFormElement>;
            handleFormChange(syntheticEvent);
        }
    }, [gender]);

    // Auto-save logic
    useEffect(() => {
        if (isInitialMount.current) { isInitialMount.current = false; return; }
        if (debouncedPayload) { autoSaveProfile(debouncedPayload); }
    }, [debouncedPayload]);

    const loadAllData = async () => {
        dispatch({ type: 'FETCH_START' });
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [profileRes, ordersRes, settingsRes] = await Promise.all([
                fetch('/api/v1/profile/me', { headers }),
                fetch('/api/v1/orders/my-orders', { headers }),
                fetch('/api/v1/settings/public')
            ]);

            if (!profileRes.ok) throw new Error('Failed to fetch profile');
            const profileData = await profileRes.json();

            // Handle orders response with error checking
            let ordersData = [];
            if (ordersRes.ok) {
                ordersData = await ordersRes.json();
            } else {
                console.warn('Failed to fetch orders:', ordersRes.status);
            }

            let settingsData = null;
            if (settingsRes.ok) settingsData = await settingsRes.json();

            dispatch({
                type: 'FETCH_SUCCESS',
                payload: { profile: profileData, orders: ordersData, settings: settingsData }
            });
            // Also set initial gender here if needed immediately, though effect handles it
            if (profileData.gender) setGender(profileData.gender);

        } catch (err: any) {
            dispatch({ type: 'FETCH_ERROR', payload: err.message || 'Failed to load profile data' });
            if (err.message === 'Not authenticated') { logout(); navigate('/login'); }
        }
    };

    const autoSaveProfile = async (payload: any) => {
        dispatch({ type: 'UPDATE_START' });
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch('/api/v1/profile/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Update failed');
            }
            dispatch({ type: 'UPDATE_LOCAL_PROFILE', payload });
            dispatch({ type: 'UPDATE_SUCCESS', payload: 'Changes auto-saved' });
        } catch (err: any) {
            dispatch({ type: 'UPDATE_ERROR', payload: err.message || 'Auto-save failed' });
        }
    };

    const handleFormChange = (e: React.FormEvent<HTMLFormElement>) => {
        // Clear any existing errors when user starts typing
        if (state.error) dispatch({ type: 'CLEAR_MESSAGES' });

        const data = new FormData(e.currentTarget);
        const rawData = Object.fromEntries(data.entries());

        let phone = rawData.phoneNumber as string;
        // Strip non-digits
        phone = phone.replace(/\D/g, '');
        // Append +91 if we have 10 digits (and it's not empty)
        if (phone.length === 10) {
            phone = '+91' + phone;
        } else if (phone.length > 0) {
            // If user somehow managed to get weird input, don't break, but it won't be valid
            // Ideally we only save valid numbers.
        }

        const payload = {
            firstName: rawData.firstName,
            lastName: rawData.lastName,
            phoneNumber: phone || undefined, // Send undefined if empty to avoid partial updates if not intended
            gender: rawData.gender
        };
        setLocalFormData(payload);
    };

    const handleOrderAction = async (action: 'cancel' | 'return' | 'exchange', reason: string) => {
        const orderId = state.modals.selectedOrderId;
        if (!orderId) return;
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');
            const apiMethod = action === 'cancel' ? OrderApi.cancelOrder : action === 'return' ? OrderApi.requestReturn : OrderApi.requestExchange;
            const updated = await apiMethod(orderId, reason, token);
            const msg = action === 'cancel' ? 'Order cancelled' : `${action} request submitted`;
            dispatch({ type: 'ORDER_ACTION_SUCCESS', payload: { message: msg, updatedOrder: updated } });
        } catch (err: any) {
            dispatch({ type: 'ORDER_ACTION_ERROR', payload: err.message || `Failed to ${action} order` });
        }
    };

    const handleLogout = () => {
        navigate('/logout');
    };

    const handleBuyAgain = async (order: any) => {
        try {
            let addedCount = 0;
            for (const item of order.items) {
                const success = await addToCart(
                    item.productId,
                    item.quantity,
                    item.size,
                    item.color,
                    false
                );
                if (success) addedCount++;
            }
            if (addedCount > 0) {
                notify(`Added ${addedCount} items to cart`, 'success');
                navigate('/cart');
            } else {
                notify('Failed to add items to cart', 'error');
            }
        } catch (error) {
            console.error('Buy again failed', error);
            notify('Failed to process request', 'error');
        }
    };



    const handleDeleteAddress = async (type: string) => {
        if (!window.confirm(`Are you sure you want to delete your ${type} address?`)) return;

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            const res = await fetch(`/api/v1/profile/me/addresses/${type}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                dispatch({ type: 'UPDATE_LOCAL_PROFILE', payload: { addresses: data.addresses } });
                if (selectedAddressIndex >= data.addresses.length) {
                    setSelectedAddressIndex(0);
                }
                notify('Address deleted successfully', 'success');
            } else {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to delete address');
            }
        } catch (err: any) {
            console.error('Delete address failed', err);
            notify(err.message || 'Error deleting address', 'error');
        }
    };

    const handleUpdateAddress = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const address = state.editingAddress;
        if (!address) return;

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            let res = await fetch(`/api/v1/profile/me/addresses/${address.addressType}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(address)
            });

            // If entry doesn't exist (404), try creating it instead
            if (res.status === 404) {
                res = await fetch(`/api/v1/profile/me/addresses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(address)
                });
            }

            if (!res.ok) throw new Error('Failed to update address');

            notify('Address updated!', 'success');
            dispatch({ type: 'CLOSE_EDIT_ADDRESS' });
            loadAllData();
        } catch (err: any) {
            notify(err.message, 'error');
        }
    };

    const verifyPincode = async (code: string) => {
        if (!/^\d{6}$/.test(code)) return;

        dispatch({ type: 'SET_PINCODE_LOADING', payload: true });

        try {
            const res = await fetch(`https://api.postalpincode.in/pincode/${code}`);
            const data = await res.json();

            if (data[0].Status === "Success") {
                const details = data[0].PostOffice[0];
                dispatch({
                    type: 'OPEN_EDIT_ADDRESS',
                    payload: {
                        ...state.editingAddress,
                        city: details.District,
                        state: details.State,
                        zipCode: code
                    }
                });
                notify(`Location identified: ${details.District}, ${details.State}`, 'success');
            } else {
                notify('Invalid ZIP Code', 'error');
            }
        } catch (err) {
            console.error('Pincode API failed', err);
            notify('Failed to verify ZIP Code', 'error');
        } finally {
            dispatch({ type: 'SET_PINCODE_LOADING', payload: false });
        }
    };

    if (state.loading) return <div className="auth-container"><DashboardSkeleton /></div>;

    // --- Helper Components for Help Section ---
    const HelpCard = ({
        id,
        title,
        icon: Icon,
        subtitle,
        children
    }: { id: string, title: string, icon: any, subtitle: string, children: React.ReactNode }) => (
        <div
            onClick={() => dispatch({ type: 'TOGGLE_HELP', payload: id })}
            className={`help-card ${state.expandedHelp === id ? 'expanded' : ''}`}
        >
            <div className="help-header">
                <div className="help-title-group">
                    <div className="help-icon-box">
                        <Icon size={20} color="#374151" />
                    </div>
                    <h3 className="help-title">{title}</h3>
                </div>
                {state.expandedHelp === id ? <ChevronDown size={20} /> : <ChevronRight size={20} color="#9ca3af" />}
            </div>
            <p className="help-subtitle">
                {subtitle}
            </p>

            {state.expandedHelp === id && (
                <div className="help-expanded-content">
                    {children}
                </div>
            )}
        </div>
    );



    return (
        <div className="profile-page">
            <div className="profile-container">
                {/* Desktop Header */}
                <div className="profile-header">
                    <h1>My Profile</h1>
                </div>

                {/* Mobile User Card */}
                <div className="user-card">
                    <div className="user-info-section">
                        <div className="user-avatar">
                            {getUserInitials(state.profile?.firstName, state.profile?.lastName, state.profile?.email)}
                        </div>
                        <div className="user-details">
                            <div className="user-name">
                                {state.profile?.firstName} {state.profile?.lastName}
                            </div>
                            <div className="user-email">{state.profile?.email}</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="logout-btn-mobile">
                        <LogOut size={18} /> Logout
                    </button>
                </div>

                {/* Tabs */}
                <div className="profile-tabs">
                    {[
                        { id: 'profile', label: 'Account', icon: User },
                        { id: 'orders', label: 'Orders', icon: Package },
                        { id: 'help', label: 'Help', icon: HelpCircle }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => dispatch({ type: 'SET_TAB', payload: tab.id as any })}
                            className={`tab-btn ${state.activeTab === tab.id ? 'active' : ''}`}
                        >
                            <tab.icon size={24} strokeWidth={1.5} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div>
                    {/* Account Settings Tab */}
                    {state.activeTab === 'profile' && (
                        <div>
                            <div className="section-header">
                                <div>
                                    <h2 className="section-title">Personal Information</h2>
                                </div>
                                {state.updating && (
                                    <span className="status-badge saving">
                                        Saving...
                                    </span>
                                )}
                            </div>

                            {/* Profile Completion Banner */}
                            {state.profile && (!state.profile.phoneNumber || !state.profile.gender || !state.profile.firstName) && (
                                <div style={{
                                    background: '#fff7ed',
                                    border: '1px solid #ffedd5',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                }}>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        background: '#ea580c',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold'
                                    }}>!</div>
                                    <div>
                                        <h4 style={{ margin: 0, color: '#9a3412', fontSize: '0.95rem' }}>Complete Your Profile</h4>
                                        <p style={{ margin: '0.25rem 0 0', color: '#c2410c', fontSize: '0.85rem' }}>
                                            Please add your {(!state.profile.phoneNumber) ? 'phone number' : (!state.profile.gender ? 'gender' : 'name')} to complete your account setup.
                                        </p>
                                    </div>
                                </div>
                            )}



                            <form ref={formRef} onChange={handleFormChange} onSubmit={(e) => e.preventDefault()}>
                                <div className="form-grid-responsive">
                                    <div className="form-item-container">
                                        <label className="form-label">First Name</label>
                                        <div style={{ position: 'relative' }}>
                                            <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                                            <input className="form-input-bold" name="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required style={{ paddingLeft: '3rem' }} />
                                        </div>
                                    </div>
                                    <div className="form-item-container">
                                        <label className="form-label">Last Name</label>
                                        <div style={{ position: 'relative' }}>
                                            <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                                            <input className="form-input-bold" name="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required style={{ paddingLeft: '3rem' }} />
                                        </div>
                                    </div>
                                    <div className="form-item-container">
                                        <label className="form-label">Email Address</label>
                                        <div className="email-display-row">
                                            <Mail size={18} style={{ flexShrink: 0, color: '#9ca3af' }} />
                                            <span className="email-text">{state.profile?.email}</span>
                                            <span className="verified-badge">Verified</span>
                                        </div>
                                    </div>
                                    <div className="form-item-container">
                                        <label className="form-label">Phone Number</label>
                                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                            <div style={{
                                                position: 'absolute',
                                                left: '16px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                zIndex: 10,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                color: '#6b7280',
                                                pointerEvents: 'none'
                                            }}>
                                                <Phone size={18} />
                                                <span style={{
                                                    fontWeight: 600,
                                                    color: '#374151',
                                                    paddingLeft: '8px',
                                                    borderLeft: '1px solid #e5e7eb',
                                                    fontSize: '0.95rem',
                                                    lineHeight: '1'
                                                }}>+91</span>
                                            </div>
                                            <input
                                                key={state.profile?.phoneNumber || 'phone-input'}
                                                className="form-input-bold"
                                                name="phoneNumber"
                                                defaultValue={state.profile?.phoneNumber ? state.profile.phoneNumber.replace(/^\+91/, '').replace(/^\+/, '') : ''}
                                                placeholder="XXXXX XXXXX"
                                                maxLength={10}
                                                style={{ paddingLeft: '5.2rem', paddingRight: '100px' }}
                                                onChange={(e) => {
                                                    // Allow only numbers
                                                    e.target.value = e.target.value.replace(/\D/g, '');
                                                    // Trigger parent change
                                                    e.currentTarget.form?.dispatchEvent(new Event('change', { bubbles: true }));
                                                }}
                                            />

                                            {state.profile?.phoneNumber && (
                                                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                                                    {state.profile.isPhoneVerified ? (
                                                        <span className="verified-badge">Verified</span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            // Disable if there's an error, saving, or the phone number in form doesn't match saved profile (unsaved changes/invalid)
                                                            disabled={!!state.error || state.loading || (localFormData?.phoneNumber && localFormData.phoneNumber !== state.profile?.phoneNumber)}
                                                            onClick={() => navigate('/verify-phone')}
                                                            style={{
                                                                background: (!!state.error || state.loading || (localFormData?.phoneNumber && localFormData.phoneNumber !== state.profile?.phoneNumber)) ? '#9ca3af' : '#111827',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                padding: '6px 12px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '600',
                                                                cursor: (!!state.error || state.loading || (localFormData?.phoneNumber && localFormData.phoneNumber !== state.profile?.phoneNumber)) ? 'not-allowed' : 'pointer'
                                                            }}
                                                        >
                                                            Verify
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {/* Inline Error for Phone Number */}
                                        {state.error && (state.error.toLowerCase().includes('valid mobile') || state.error.toLowerCase().includes('registered')) && (
                                            <div style={{
                                                color: '#ef4444',
                                                fontSize: '0.8rem',
                                                marginTop: '0.25rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                            }}>
                                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                                                {state.error}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Gender</label>
                                        <CustomSelect
                                            icon={User}
                                            placeholder="Select your gender"
                                            value={gender}
                                            onChange={setGender}
                                            options={[
                                                { value: 'male', label: 'Male' },
                                                { value: 'female', label: 'Female' },
                                                { value: 'other', label: 'Other' },
                                                { value: 'prefer_not_to_say', label: 'Prefer not to say' }
                                            ]}
                                        />
                                        <input type="hidden" name="gender" value={gender} />
                                    </div>
                                </div>

                                <div className="address-section" style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid #f3f4f6' }}>
                                    <div className="section-header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                                        <div>
                                            <h2 className="section-title">Saved Addresses</h2>
                                            <p className="section-subtitle">Manage your delivery locations</p>
                                        </div>
                                    </div>

                                    {(state.profile?.addresses || []).length > 0 ? (
                                        <>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                                {(state.profile?.addresses || []).map((addr: any, index: number) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => setSelectedAddressIndex(index)}
                                                        className={`address-card-v2 ${selectedAddressIndex === index ? 'active' : ''}`}
                                                        style={{
                                                            border: selectedAddressIndex === index ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                                            borderRadius: '20px',
                                                            padding: '1.5rem',
                                                            background: selectedAddressIndex === index ? '#f0f7ff' : '#fff',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            position: 'relative',
                                                            boxShadow: selectedAddressIndex === index ? '0 4px 20px -5px rgba(59, 130, 246, 0.15)' : 'none'
                                                        }}
                                                    >
                                                        {/* Card Header: Selection, Title, Badge & Actions */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                                {/* Custom Radio */}
                                                                <div style={{
                                                                    width: '24px',
                                                                    height: '24px',
                                                                    border: selectedAddressIndex === index ? '2px solid #3b82f6' : '2px solid #d1d5db',
                                                                    borderRadius: '50%',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    background: selectedAddressIndex === index ? '#3b82f6' : '#fff',
                                                                    transition: 'all 0.2s'
                                                                }}>
                                                                    {selectedAddressIndex === index && (
                                                                        <div style={{ width: '10px', height: '10px', background: '#fff', borderRadius: '50%' }} />
                                                                    )}
                                                                </div>

                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
                                                                        {addr.addressType.charAt(0).toUpperCase() + addr.addressType.slice(1)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'OPEN_EDIT_ADDRESS', payload: addr }); }}
                                                                    style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px', transition: 'color 0.2s' }}
                                                                    onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
                                                                    onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                                                                >
                                                                    <Pencil size={20} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.addressType); }}
                                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', transition: 'color 0.2s' }}
                                                                    onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                                                                    onMouseLeave={e => e.currentTarget.style.color = '#ef4444'}
                                                                >
                                                                    <Trash2 size={20} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Card Body: Address Info with Pin */}
                                                        <div style={{ display: 'flex', gap: '0.75rem', paddingLeft: '2.5rem' }}>
                                                            <MapPin size={20} style={{ color: '#9ca3af', flexShrink: 0, marginTop: '2px' }} />
                                                            <div style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: 1.6 }}>
                                                                <div style={{ fontWeight: 500, color: '#374151' }}>{addr.street}</div>
                                                                <div>{addr.city}, {addr.state} {addr.zipCode}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Add Address Button - Below address list */}
                                            {(state.profile?.addresses || []).length < 3 && (
                                                <button
                                                    type="button"
                                                    onClick={() => dispatch({ type: 'OPEN_EDIT_ADDRESS', payload: { street: '', city: '', state: '', zipCode: '', addressType: 'primary' } })}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '1rem'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        background: '#2563eb',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#fff',
                                                        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                                                    }}>
                                                        <span style={{ fontSize: '24px', fontWeight: 300 }}>+</span>
                                                    </div>
                                                    <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '1.1rem' }}>Add New Address</span>
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '3rem 1rem',
                                            background: '#f9fafb',
                                            borderRadius: '16px',
                                            border: '1px dashed #e5e7eb'
                                        }}>
                                            <Truck size={32} style={{ color: '#9ca3af', margin: '0 auto 1rem' }} />
                                            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>No addresses saved yet</h4>
                                            <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1.5rem' }}>Save your address for a faster checkout experience</p>
                                            <button
                                                type="button"
                                                onClick={() => dispatch({ type: 'OPEN_EDIT_ADDRESS', payload: { street: '', city: '', state: '', zipCode: '', addressType: 'default' } })}
                                                style={{
                                                    color: '#2563eb',
                                                    fontWeight: '700',
                                                    border: 'none',
                                                    background: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                + Add New Address
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    {/* My Orders Tab */}
                    {state.activeTab === 'orders' && (
                        <div>
                            <div className="section-header">
                                <h2 className="section-title">Order History</h2>
                                <p className="section-subtitle">View and track your recent orders</p>
                            </div>
                            {(state.orderError || state.orderSuccess) && (
                                <div className={`status-message ${state.orderError ? 'error' : 'success'}`}>
                                    {state.orderError || state.orderSuccess}
                                </div>
                            )}
                            {state.orders.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon"><Package size={32} /></div>
                                    <h3 className="empty-state-title">No orders yet</h3>
                                    <p className="empty-state-description">Start shopping to see your orders here.</p>
                                    <Link to="/products" className="empty-state-action">Browse Products</Link>
                                </div>
                            ) : (
                                <div className="orders-container">
                                    {state.orders.map((order: any) => {
                                        const firstItem = order.items?.[0];
                                        const status = order.status?.toUpperCase() || 'PENDING';

                                        return (
                                            <div key={order.orderId} className="order-card">
                                                {/* Order Header */}
                                                <div className="order-header">
                                                    <div className="order-id-section">
                                                        <div className="order-id">{order.orderId}</div>
                                                        <div className="order-date">{new Date(order.createdAt).toLocaleDateString()}</div>
                                                    </div>
                                                    <span className={`order-status ${status.toLowerCase()}`}>{status}</span>
                                                </div>

                                                {/* Product Preview (First Item) */}
                                                {firstItem && (
                                                    <Link
                                                        to={`/products/${firstItem.productId}`}
                                                        style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid #f3f4f6', textDecoration: 'none', cursor: 'pointer', color: 'inherit' }}
                                                    >
                                                        <div style={{ width: '80px', height: '80px', background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                                            {firstItem.product?.images?.[0]?.url ? (
                                                                <img src={firstItem.product.images[0].url} alt={firstItem.product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                                                    <Package size={24} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>{firstItem.product?.title || 'Item Unavailable'}</div>
                                                            <div style={{ fontSize: '0.85rem', color: '#6b7280', display: 'flex', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                                                {firstItem.size && <span>Size: <span style={{ color: '#374151' }}>{firstItem.size}</span></span>}
                                                                {firstItem.color && <span>Color: <span style={{ color: '#374151' }}>{firstItem.color}</span></span>}
                                                                <span>Qty: <span style={{ color: '#374151' }}>{firstItem.quantity}</span></span>
                                                            </div>
                                                            {order.items.length > 1 && (
                                                                <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: '500' }}>
                                                                    + {order.items.length - 1} more items
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Link>
                                                )}

                                                {/* Order Footer & Actions */}
                                                <div style={{ marginTop: '1rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                        <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Order Total</div>
                                                        <div className="order-total">₹{(order.total / 100).toFixed(2)}</div>
                                                    </div>

                                                    <div className="order-actions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                        <Link to={`/order-tracking/${order.orderId}`} className="view-details-btn" style={{ textAlign: 'center', textDecoration: 'none', background: 'white', border: '1px solid #e5e7eb', color: '#111827' }}>
                                                            View Details
                                                        </Link>

                                                        {status === 'PENDING' && (
                                                            <button className="view-details-btn" onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'cancel', orderId: order.orderId } })} style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b' }}>
                                                                Cancel Order
                                                            </button>
                                                        )}
                                                        {status === 'DELIVERED' && (
                                                            <button
                                                                className="view-details-btn"
                                                                style={{ background: '#111827', color: 'white', border: 'none', cursor: 'pointer' }}
                                                                onClick={() => handleBuyAgain(order)}
                                                            >
                                                                Buy Again
                                                            </button>
                                                        )}
                                                        {status === 'CANCELLED' && (
                                                            <button
                                                                className="view-details-btn"
                                                                style={{ background: '#111827', color: 'white', border: 'none', cursor: 'pointer' }}
                                                                onClick={() => handleBuyAgain(order)}
                                                            >
                                                                Buy Again
                                                            </button>
                                                        )}
                                                        {status === 'PROCESSING' && (
                                                            <button className="view-details-btn" style={{ background: '#dbeafe', border: '1px solid #93c5fd', color: '#1e40af' }}>
                                                                Track Order
                                                            </button>
                                                        )}
                                                    </div>

                                                    {status === 'DELIVERED' && (
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                                                            <button className="view-details-btn" onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'return', orderId: order.orderId } })} style={{ background: '#fed7aa', border: '1px solid #fdba74', color: '#92400e' }}>
                                                                Return
                                                            </button>
                                                            <button className="view-details-btn" onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'exchange', orderId: order.orderId } })} style={{ background: '#d1fae5', border: '1px solid #a7f3d0', color: '#065f46' }}>
                                                                Exchange
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Help & Support Tab */}
                    {state.activeTab === 'help' && (
                        <div className="help-tab-content">
                            <div className="help-tab-header">
                                <h2 className="help-main-title">Help & Support</h2>
                                <div className="support-status-pill">
                                    <div className="status-dot"></div>
                                    <span>Support Online</span>
                                </div>
                            </div>

                            <div className="help-list-container">
                                <HelpCard
                                    id="contact"
                                    title="Contact Support"
                                    subtitle="Reach out to our customer service"
                                    icon={Mail}
                                >
                                    <div className="help-expanded-inner">
                                        <p>We are available 24/7 to assist you.</p>
                                        <div className="contact-info-row">
                                            <Mail size={16} /> <a href="mailto:threadsfashion@zohoin.com">threadsfashion@zohoin.com</a>
                                        </div>
                                        <div className="contact-info-row">
                                            <Phone size={16} /> <span>{state.settings?.supportPhone || '+1 (555) 123-4567'}</span>
                                        </div>
                                    </div>
                                </HelpCard>

                                <HelpCard
                                    id="faq"
                                    title="FAQs"
                                    subtitle="Common questions answered"
                                    icon={MessageCircle}
                                >
                                    <div className="help-expanded-inner">
                                        <ul className="help-list-ul">
                                            <li><strong>How do I track my order?</strong><br />Go to "My Orders" and click "View Details".</li>
                                            <li><strong>Can I change my address?</strong><br />Yes, update it in the Account Settings tab.</li>
                                            <li><strong>Do you ship internationally?</strong><br />Currently only within India.</li>
                                        </ul>
                                    </div>
                                </HelpCard>

                                <HelpCard
                                    id="return"
                                    title="Return Policy"
                                    subtitle="Returns and refunds guide"
                                    icon={RotateCcw}
                                >
                                    <div className="help-expanded-inner">
                                        <p>
                                            We offer a <strong>{state.settings?.returnWindowDays || 30}-day return policy</strong> for unworn items in original packaging.
                                            <br /><br />
                                            To initiate a return, go to "My Orders", select the order, and click "Return". Refunds are processed within 5-7 business days.
                                        </p>
                                    </div>
                                </HelpCard>

                                <HelpCard
                                    id="shipping"
                                    title="Shipping Info"
                                    subtitle="Delivery times and costs"
                                    icon={Truck}
                                >
                                    <div className="help-expanded-inner">
                                        <p>
                                            <strong>Standard Shipping:</strong> 3-5 business days (Free over ₹999).<br />
                                            <strong>Express Shipping:</strong> 1-2 business days.<br /><br />
                                            You will receive a tracking link via email once your order ships.
                                        </p>
                                    </div>
                                </HelpCard>
                            </div>

                            <div className="help-footer-card">
                                <h3 className="help-footer-title">Still need help?</h3>
                                <button className="btn-chat-support">
                                    Chat with us
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div >

            <ReasonModal isOpen={state.modals.cancel} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} onSubmit={(reason) => handleOrderAction('cancel', reason)} title="Cancel Order" placeholder="Reason..." type="cancel" />
            <ReasonModal isOpen={state.modals.return} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} onSubmit={(reason) => handleOrderAction('return', reason)} title="Request Return" placeholder="Reason..." type="return" />
            <ReasonModal isOpen={state.modals.exchange} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} onSubmit={(reason) => handleOrderAction('exchange', reason)} title="Request Exchange" placeholder="Reason..." type="exchange" />


            {/* Edit Address Modal */}
            {
                state.modals.editAddress && state.editingAddress && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{
                            width: '95%',
                            maxWidth: '500px',
                            borderRadius: '20px',
                            padding: '24px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                        }}>
                            <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Edit Address</h3>
                                <button
                                    onClick={() => dispatch({ type: 'CLOSE_EDIT_ADDRESS' })}
                                    className="modal-close"
                                    style={{ borderRadius: '50%', padding: '8px', background: '#f3f4f6' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateAddress}>
                                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Address Type</label>
                                    <select
                                        className="form-input"
                                        value={state.editingAddress.addressType}
                                        onChange={e => dispatch({ type: 'OPEN_EDIT_ADDRESS', payload: { ...state.editingAddress, addressType: e.target.value } })}
                                        required
                                        style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '0.95rem', background: '#fff' }}
                                    >
                                        <option value="default">Default</option>
                                        <option value="primary">Primary</option>
                                        <option value="secondary">Secondary</option>
                                    </select>
                                    <small style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                                        'Default' will be your main shipping address.
                                    </small>
                                </div>

                                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Street Address</label>
                                    <input
                                        className="form-input"
                                        value={state.editingAddress.street}
                                        onChange={e => dispatch({ type: 'OPEN_EDIT_ADDRESS', payload: { ...state.editingAddress, street: e.target.value } })}
                                        required
                                        style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '0.95rem' }}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>City</label>
                                    <input
                                        className="form-input"
                                        value={state.editingAddress.city}
                                        onChange={e => dispatch({ type: 'OPEN_EDIT_ADDRESS', payload: { ...state.editingAddress, city: e.target.value } })}
                                        required
                                        style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '0.95rem' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>State</label>
                                        <input
                                            className="form-input"
                                            value={state.editingAddress.state}
                                            onChange={e => dispatch({ type: 'OPEN_EDIT_ADDRESS', payload: { ...state.editingAddress, state: e.target.value } })}
                                            required
                                            style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '0.95rem' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Zip Code</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                className="form-input"
                                                value={state.editingAddress.zipCode}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                    dispatch({ type: 'OPEN_EDIT_ADDRESS', payload: { ...state.editingAddress, zipCode: val } });
                                                    if (val.length === 6) verifyPincode(val);
                                                }}
                                                required
                                                maxLength={6}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '12px',
                                                    fontSize: '0.95rem',
                                                    background: state.pincodeLoading ? '#f9fafb' : 'white'
                                                }}
                                            />
                                            {state.pincodeLoading && (
                                                <div style={{
                                                    position: 'absolute',
                                                    right: '12px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    width: '16px',
                                                    height: '16px',
                                                    border: '2px solid #e5e7eb',
                                                    borderTopColor: '#2563eb',
                                                    borderRadius: '50%',
                                                    animation: 'spin 1s linear infinite'
                                                }} />
                                            )}
                                        </div>
                                        <small style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                                            Location auto-identified on 6th digit
                                        </small>
                                    </div>
                                </div>
                                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button type="button" onClick={() => dispatch({ type: 'CLOSE_EDIT_ADDRESS' })} className="btn-secondary" style={{ padding: '12px 20px', background: 'transparent', color: 'black', border: '1px solid black', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ padding: '12px 24px', background: '#111', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default Profile;