import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { API_BASE } from '../config/api.config';
import '../styles/checkout.css';
import { useCartContext } from '../context/CartContext';
import { OrderApi } from '../api/orders.api';
import { useAuthContext } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { ChevronLeft, MapPin, ShieldCheck, Lock, Truck, Banknote, CheckCircle, Info, AlertCircle, Trash2, Pencil } from 'lucide-react';
import { calculateDeliveryDate } from '../utils/shipping-calculator';

export default function PlaceOrder() {
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const { cart: contextCart, clearCart } = useCartContext();
    const { user } = useAuthContext();
    const { notify } = useNotification();

    const productToBuy = location.state?.product;
    const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [warehouseZipCode, setWarehouseZipCode] = useState('110001');
    // Profile Data
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [selectedAddressIdx, setSelectedAddressIdx] = useState(() => {
        const saved = sessionStorage.getItem('selectedAddressIdx');
        return saved ? parseInt(saved, 10) : 0;
    });
    // Payment State
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'upi' | 'cod' | null>('card');
    const [upiId, setUpiId] = useState('');

    // Card Details State
    const [cardDetails, setCardDetails] = useState({
        number: '',
        expiry: '',
        cvc: '',
        name: ''
    });

    // UI States
    const [isChangingAddress, setIsChangingAddress] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);

    // Address form state
    const [addressForm, setAddressForm] = useState({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        addressType: 'default' as 'default' | 'primary' | 'secondary'
    });
    const [editingAddress, setEditingAddress] = useState<any>(null);
    const [addressFormError, setAddressFormError] = useState('');
    const [pincodeLoading, setPincodeLoading] = useState(false);
    const [pincodeInfo, setPincodeInfo] = useState('');

    const verifyPincode = async (code: string) => {
        if (!/^\d{6}$/.test(code)) {
            setPincodeInfo('');
            return;
        }

        setPincodeLoading(true);
        setAddressFormError('');
        setPincodeInfo('');

        try {
            const res = await fetch(`https://api.postalpincode.in/pincode/${code}`);
            const data = await res.json();

            if (data[0].Status === "Success") {
                const details = data[0].PostOffice[0];
                setAddressForm(prev => ({
                    ...prev,
                    city: details.District,
                    state: details.State,
                    zipCode: code
                }));
                const info = `${details.District}, ${details.State}`;
                setPincodeInfo(info);
                notify(`Location identified: ${info}`, 'success');
            } else {
                setAddressFormError('Invalid ZIP Code');
                setPincodeInfo('Invalid ZIP Code');
                notify('Could not find location for this ZIP Code', 'error');
            }
        } catch (err) {
            console.error('Pincode API failed', err);
        } finally {
            setPincodeLoading(false);
        }
    };

    // Helper to validly parse price
    const parsePrice = (input: any): number => {
        if (input === null || input === undefined) return 0;
        if (typeof input === 'number') return input;
        if (typeof input === 'string') {
            // Remove commas and non-numeric chars except dot
            const clean = input.replace(/,/g, '').replace(/[^\d.]/g, '');
            return Number(clean) || 0;
        }
        if (typeof input === 'object') {
            return parsePrice(input.amount || input.price || input.value || 0);
        }
        return 0;
    };

    useEffect(() => {
        fetchProfile();
        fetchSettings();

        if (productToBuy) {
            const finalPrice = parsePrice(productToBuy.price);
            setCheckoutItems([{
                productId: productToBuy.id,
                title: productToBuy.title,
                quantity: 1,
                price: finalPrice,
                images: productToBuy.images
            }]);
            setTotalPrice(finalPrice);
        } else if (contextCart && contextCart.items.length > 0) {
            const mappedItems = contextCart.items.map(item => {
                // Robust price resolution: prefer item.price, but fallback to populated product price if 0
                let finalPrice = parsePrice(item.price);
                if (finalPrice === 0 && (item.productId as any)?.price) {
                    finalPrice = parsePrice((item.productId as any).price);
                }

                return {
                    productId: (item.productId as any)._id || item.productId,
                    title: (item.productId as any).title || item.title,
                    quantity: item.quantity,
                    price: finalPrice,
                    images: (item.productId as any).images || [],
                    size: item.size,
                    color: item.color,
                };
            });
            setCheckoutItems(mappedItems);

            // Recalculate total if cart.total is suspicious (0)
            const safeTotal = parsePrice(contextCart.total);
            if (safeTotal > 0) {
                setTotalPrice(safeTotal);
            } else {
                // Manual calc
                const manualTotal = mappedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
                setTotalPrice(manualTotal);
            }
        }
    }, [productToBuy, contextCart]);

    useEffect(() => {
        if (showAddressForm) {
            const availableTypes = getAvailableAddressTypes();
            if (availableTypes.length > 0 && !editingAddress) { // Only set default if adding new and not editing
                setAddressForm(prev => ({
                    ...prev,
                    addressType: availableTypes[0]
                }));
            }
        }
    }, [showAddressForm, editingAddress]);

    useEffect(() => {
        sessionStorage.setItem('selectedAddressIdx', selectedAddressIdx.toString());
    }, [selectedAddressIdx]);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch(`${API_BASE}/profile/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSavedAddresses(data.addresses || []);
            }
        } catch (err) {
            console.error('Failed to fetch profile', err);
        } finally {
            setProfileLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_BASE}/settings/public`);
            if (res.ok) {
                const data = await res.json();
                if (data.warehouseZipCode) setWarehouseZipCode(data.warehouseZipCode);
            }
        } catch (err) {
            console.error('Failed to fetch store settings', err);
        }
    };

    const handleCardInput = (field: string, value: string) => {
        let formatted = value;
        if (field === 'number') {
            formatted = value.replace(/\D/g, '').slice(0, 16);
            formatted = formatted.replace(/(\d{4})/g, '$1 ').trim();
        } else if (field === 'expiry') {
            formatted = value.replace(/\D/g, '').slice(0, 4);
            if (formatted.length >= 2) {
                formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
            }
        } else if (field === 'cvc') {
            formatted = value.replace(/\D/g, '').slice(0, 3);
        }
        setCardDetails(prev => ({ ...prev, [field]: formatted }));
    };

    async function handlePlaceOrder() {
        if (!savedAddresses[selectedAddressIdx]) {
            notify('Please select or add a delivery address', 'error');
            return;
        }

        if (!selectedPaymentMethod) {
            notify('Please select a payment method', 'error');
            return;
        }

        // CRITICAL: Payment Details Validation
        if (selectedPaymentMethod === 'card') {
            if (!cardDetails.number || cardDetails.number.replace(/\s/g, '').length < 16) {
                notify('Please enter a valid card number', 'error');
                return;
            }
            if (!cardDetails.expiry || cardDetails.expiry.length < 5) {
                notify('Please enter card expiry date', 'error');
                return;
            }
            if (!cardDetails.cvc || cardDetails.cvc.length < 3) {
                notify('Please enter card CVV', 'error');
                return;
            }
            if (!cardDetails.name) {
                notify('Please enter cardholder name', 'error');
                return;
            }
        }

        if (selectedPaymentMethod === 'upi') {
            if (!upiId) {
                notify('Please enter your UPI ID', 'error');
                return;
            }
            if (!upiId.includes('@')) {
                notify('Invalid UPI ID format', 'error');
                return;
            }
        }

        setLoading(true);
        const address = savedAddresses[selectedAddressIdx];

        const payload = {
            items: checkoutItems.map(it => ({
                productId: it.productId,
                quantity: it.quantity,
                size: it.size,
                color: it.color,
                image: it.images && it.images.length > 0 ? it.images[0].url : ''
            })),
            total: totalPrice,
            shippingAddress: {
                street: address.street,
                city: address.city,
                state: address.state,
                zipCode: address.zipCode
            },
            paymentMethod: selectedPaymentMethod,
            paymentDetails: selectedPaymentMethod === 'card'
                ? { last4: cardDetails.number.slice(-4), brand: 'Visa' }
                : { upiId: upiId }
        };

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            const order = await OrderApi.createOrder(payload, token);
            if (!productToBuy) await clearCart();

            navigate(`/order-success/${order.orderId}`, { state: { address: payload.shippingAddress } });
        } catch (error: any) {
            notify(error.message || 'Order failed. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    }

    const handleAddAddress = async () => {
        setAddressFormError('');

        // Validate form
        if (!addressForm.street || !addressForm.city || !addressForm.state || !addressForm.zipCode) {
            setAddressFormError('All fields are required');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            const url = editingAddress
                ? `${API_BASE}/profile/me/addresses/${editingAddress.addressType}`
                : `${API_BASE}/profile/me/addresses`;

            const method = editingAddress ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(addressForm)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to add address');
            }

            // Update local state with new addresses
            setSavedAddresses(data.addresses);

            // Reset form and close modal
            setAddressForm({
                street: '',
                city: '',
                state: '',
                zipCode: '',
                addressType: 'default'
            });
            setShowAddressForm(false);
            setIsChangingAddress(false);
            setEditingAddress(null);

            notify(editingAddress ? 'Address updated successfully' : 'Address added successfully', 'success');
        } catch (error: any) {
            setAddressFormError(error.message || 'Failed to add address');
            notify(error.message || 'Failed to add address', 'error');
        }
    };

    const getAvailableAddressTypes = () => {
        const existingTypes = savedAddresses.map(addr => addr.addressType);
        const allTypes: Array<'default' | 'primary' | 'secondary'> = ['default', 'primary', 'secondary'];

        if (editingAddress) {
            // For editing, current type is also available plus any unused ones
            return allTypes.filter(type => type === editingAddress.addressType || !existingTypes.includes(type));
        }

        return allTypes.filter(type => !existingTypes.includes(type));
    };

    const handleDeleteAddress = async (type: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete your ${type} address?`)) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_BASE}/profile/me/addresses/${type}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete address');
            }

            const data = await response.json();
            setSavedAddresses(data.addresses);
            if (selectedAddressIdx >= data.addresses.length) {
                setSelectedAddressIdx(0);
            }
            notify('Address deleted successfully', 'success');
        } catch (error: any) {
            notify(error.message, 'error');
        }
    };

    const openEditAddress = (addr: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setAddressForm({
            street: addr.street,
            city: addr.city,
            state: addr.state,
            zipCode: addr.zipCode,
            addressType: addr.addressType
        });
        setEditingAddress(addr);
        setPincodeInfo(`${addr.city}, ${addr.state}`);
        setShowAddressForm(true);
    };

    const formatPrice = (amount: number) => {
        return (amount / 100).toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        });
    };

    const getDeliveryEstimation = (targetZip: string) => {
        return calculateDeliveryDate(warehouseZipCode, targetZip);
    };

    if (!checkoutItems.length && !loading && !profileLoading) {
        return (
            <div className="checkout-page empty">
                <div className="empty-cart-msg">
                    <h2>Your checkout is empty</h2>
                    <Link to="/products" className="btn-return">Return to Shop</Link>
                </div>
            </div>
        );
    }

    const currentAddress = savedAddresses[selectedAddressIdx] || null;

    return (
        <div className="checkout-page-professional">
            {/* Header */}
            <header className="checkout-header-clean">
                <div className="header-inner">
                    <button onClick={() => navigate(-1)} className="btn-back-minimal">
                        <ChevronLeft size={20} /> <span>Back</span>
                    </button>
                    <h1 className="header-title-clean">Checkout</h1>
                </div>
            </header>

            <div className="checkout-content-wrapper">
                <main className="checkout-main-content">
                    {/* 1. Address Section */}
                    <section className="checkout-section-glass">
                        <div className="section-header-compact">
                            <div className="section-title-group">
                                <h2 className="section-title">Shipping Address</h2>
                            </div>
                            {!isChangingAddress && currentAddress && (
                                <button className="btn-edit-link" onClick={() => setIsChangingAddress(true)}>Change</button>
                            )}
                        </div>

                        <div className="section-body">
                            {!isChangingAddress ? (
                                <div className="summary-info-row">
                                    <MapPin size={18} className="info-icon" />
                                    <div className="info-text">
                                        {currentAddress ? (
                                            <>
                                                <p className="recipient-name">
                                                    {user ? `${user.firstName} ${user.lastName}` : (location.state?.userName || 'Customer')}
                                                </p>
                                                <p className="address-text">{currentAddress.street}, {currentAddress.city}</p>
                                                <p className="address-text">{currentAddress.state} {currentAddress.zipCode}, India</p>
                                            </>
                                        ) : (
                                            <div className="empty-state-mini">
                                                <p>No shipping address selected</p>
                                                <button className="btn-add-primary" onClick={() => setIsChangingAddress(true)}>Add Address</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="address-selection-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {savedAddresses.map((addr, i) => (
                                        <div
                                            key={i}
                                            className={`address-option-card ${selectedAddressIdx === i ? 'active' : ''}`}
                                            onClick={() => { setSelectedAddressIdx(i); setIsChangingAddress(false); }}
                                            style={{
                                                border: selectedAddressIdx === i ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                                borderRadius: '20px',
                                                padding: '1.5rem',
                                                background: selectedAddressIdx === i ? '#f0f7ff' : '#fff',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                position: 'relative',
                                                boxShadow: selectedAddressIdx === i ? '0 4px 20px -5px rgba(59, 130, 246, 0.15)' : 'none',
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}
                                        >
                                            {/* Card Header: Selection, Title, Badge & Actions */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', width: '100%' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    {/* Custom Radio */}
                                                    <div style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        border: selectedAddressIdx === i ? '2px solid #3b82f6' : '2px solid #d1d5db',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: selectedAddressIdx === i ? '#3b82f6' : '#fff',
                                                        transition: 'all 0.2s'
                                                    }}>
                                                        {selectedAddressIdx === i && (
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
                                                        onClick={(e) => openEditAddress(addr, e)}
                                                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px', transition: 'color 0.2s' }}
                                                        onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
                                                        onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                                                    >
                                                        <Pencil size={20} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDeleteAddress(addr.addressType, e)}
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', transition: 'color 0.2s' }}
                                                        onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                                                        onMouseLeave={e => e.currentTarget.style.color = '#ef4444'}
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Card Body: Address Info with Pin */}
                                            <div style={{ display: 'flex', gap: '0.75rem', paddingLeft: '2.5rem', width: '100%' }}>
                                                <MapPin size={20} style={{ color: '#9ca3af', flexShrink: 0, marginTop: '2px' }} />
                                                <div style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: 1.6 }}>
                                                    <div style={{ fontWeight: 500, color: '#374151' }}>{addr.street}</div>
                                                    <div>{addr.city}, {addr.state} {addr.zipCode}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}{savedAddresses.length < 3 && (
                                        <button
                                            className="btn-add-address-premium"
                                            onClick={() => {
                                                setEditingAddress(null);
                                                setAddressForm({ street: '', city: '', state: '', zipCode: '', addressType: 'default' });
                                                setPincodeInfo('');
                                                setShowAddressForm(true);
                                                setIsChangingAddress(false);
                                            }}
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
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 2. Payment Section */}
                    <section className="checkout-section-glass">
                        <div className="section-header-compact">
                            <div className="section-title-group">
                                <h2 className="section-title">Payment Method</h2>
                            </div>
                        </div>

                        <div className="section-body">
                            <div className="payment-methods-grid">
                                {/* CARD OPTION */}
                                <div
                                    className={`payment-method-card ${selectedPaymentMethod === 'card' ? 'selected' : ''}`}
                                    onClick={() => setSelectedPaymentMethod(selectedPaymentMethod === 'card' ? null : 'card')}
                                >
                                    <div className="method-header">
                                        <div className="radio-circle">
                                            {selectedPaymentMethod === 'card' && <div className="inner-dot" />}
                                        </div>
                                        <span className="method-name">Credit / Debit Card</span>
                                        <div className="method-logos">
                                            {/* Visa Logo */}
                                            <svg height="24" viewBox="0 0 48 32" fill="none" className="payment-logo">
                                                <rect width="48" height="32" rx="4" fill="#F3F4F6" />
                                                <path d="M19.9688 22.0938L22.9688 4.09375H17.5938L15.0625 15.6562H15.0312C14.5 13.7812 13.5625 11.5312 12.0938 10.75C13.75 10.5312 16.0625 10.375 17.6562 10.375H21.0625L20.8125 11.625L18.5312 22.0938H19.9688ZM26.5312 11.625C26.9688 11.625 27.3125 11.75 27.4688 12.0625L28.8438 18.2812L29.6875 14.1875C29.6875 14.1875 30.3438 10.875 30.4062 10.375H34.0938L30.4062 22.0938H26.75L25.0625 14.375L24.2188 22.0938H20.625L21.7188 17.0625L22.9062 11.625H26.5312ZM34.8438 10.375L32.3125 22.0938H35.4688L38 10.375H34.8438ZM16.0312 10.375C16.0312 10.375 13.5312 10.75 11.9062 13.9688L11.0312 9.40625L8 10.375L8.53125 11.4688C11.0938 11.7812 14.0312 12.875 15.9062 16.5H16.0625L16.9375 10.375H16.0312Z" fill="#1A1F71" />
                                            </svg>
                                            {/* Mastercard Logo */}
                                            <svg height="24" viewBox="0 0 32 20" className="payment-logo" style={{ marginLeft: '8px' }}>
                                                <g fill="none">
                                                    <rect width="32" height="20" rx="3" fill="#F3F4F6" />
                                                    <circle cx="11" cy="10" r="6" fill="#EB001B" />
                                                    <circle cx="21" cy="10" r="6" fill="#F79E1B" />
                                                    <path d="M16 14C14.5 13.2 13.5 11.7 13.5 10C13.5 8.3 14.5 6.8 16 6C17.5 6.8 18.5 8.3 18.5 10C18.5 11.7 17.5 13.2 16 14Z" fill="#FF5F00" />
                                                </g>
                                            </svg>
                                        </div>
                                    </div>

                                    {selectedPaymentMethod === 'card' && (
                                        <div
                                            className="payment-details-form card-entry-form"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* Card Number */}
                                            <div className="modern-input-group">
                                                <input
                                                    type="text"
                                                    required
                                                    maxLength={19}
                                                    placeholder=" "
                                                    className="modern-input"
                                                    value={cardDetails.number}
                                                    onChange={(e) => handleCardInput('number', e.target.value)}
                                                />
                                                <label className="modern-label">Card Number</label>
                                                <div className="input-icon-right success">
                                                    {cardDetails.number.replace(/\s/g, '').length >= 16 && <CheckCircle size={16} color="#16a34a" fill="#dcfce7" />}
                                                </div>
                                            </div>

                                            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '1rem', gap: '1rem' }}>
                                                {/* Expiry */}
                                                <div className="modern-input-group">
                                                    <input
                                                        type="text"
                                                        required
                                                        maxLength={5}
                                                        placeholder=" "
                                                        className="modern-input"
                                                        value={cardDetails.expiry}
                                                        onChange={(e) => handleCardInput('expiry', e.target.value)}
                                                    />
                                                    <label className="modern-label">Expiry Date (MM/YY)</label>
                                                </div>

                                                {/* CVV */}
                                                <div className="modern-input-group">
                                                    <input
                                                        type="text"
                                                        required
                                                        maxLength={3}
                                                        placeholder=" "
                                                        className="modern-input"
                                                        value={cardDetails.cvc}
                                                        onChange={(e) => handleCardInput('cvc', e.target.value)}
                                                    />
                                                    <label className="modern-label">CVV</label>
                                                    <div className="input-icon-right">
                                                        <Info size={16} color="#94a3b8" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Cardholder Name */}
                                            <div className="modern-input-group" style={{ marginTop: '1rem' }}>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder=" "
                                                    className="modern-input"
                                                    value={cardDetails.name}
                                                    onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                                                />
                                                <label className="modern-label">Cardholder Name</label>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* UPI OPTION */}
                                <div
                                    className={`payment-method-card ${selectedPaymentMethod === 'upi' ? 'selected' : ''}`}
                                    onClick={() => setSelectedPaymentMethod(selectedPaymentMethod === 'upi' ? null : 'upi')}
                                >
                                    <div className="method-header">
                                        <div className="radio-circle">
                                            {selectedPaymentMethod === 'upi' && <div className="inner-dot" />}
                                        </div>
                                        <span className="method-name">UPI</span>
                                        <div className="method-logos">
                                            <span style={{ fontSize: '10px', fontWeight: 900, color: '#444', border: '1px solid #ddd', padding: '2px 4px', borderRadius: '4px' }}>UPI</span>
                                        </div>
                                    </div>

                                    {selectedPaymentMethod === 'upi' && (
                                        <div
                                            className="payment-details-form"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="upi-apps">
                                                <div className="app-badge" style={{ color: '#4285F4' }}>
                                                    <span style={{ fontWeight: 700 }}>G</span>Pay
                                                </div>
                                                <div className="app-badge" style={{ color: '#5f259f' }}>
                                                    PhonePe
                                                </div>
                                                <div className="app-badge" style={{ color: '#00B9F1', fontWeight: 700 }}>
                                                    Paytm
                                                </div>
                                            </div>
                                            <div className="upi-input-group">
                                                <input
                                                    type="text"
                                                    placeholder="Enter UPI ID (e.g. mobile@upi)"
                                                    className="upi-input"
                                                    value={upiId}
                                                    onChange={(e) => setUpiId(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Cash on Delivery */}
                                <div
                                    className={`payment-method-card ${selectedPaymentMethod === 'cod' ? 'selected' : ''}`}
                                    onClick={() => setSelectedPaymentMethod(selectedPaymentMethod === 'cod' ? null : 'cod')}
                                >
                                    <div className="method-header">
                                        <div className="radio-circle">
                                            {selectedPaymentMethod === 'cod' && <div className="inner-dot" />}
                                        </div>
                                        <span className="method-name">Cash on Delivery</span>
                                        <div className="method-logos">
                                            <Banknote size={20} color="#166534" />
                                        </div>
                                    </div>

                                    {selectedPaymentMethod === 'cod' && (
                                        <div className="payment-details-form">
                                            <p className="cod-message">Pay comfortably with cash when your order arrives.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. Items Review Section */}
                    <section className="checkout-section-glass">
                        <div className="section-header-compact">
                            <div className="section-title-group">
                                <h2 className="section-title">Review Items</h2>
                            </div>
                            <span className="item-count-tag">{checkoutItems.length} {checkoutItems.length === 1 ? 'Item' : 'Items'}</span>
                        </div>

                        <div className="section-body">
                            <div className="items-review-list">
                                {checkoutItems.map((item, idx) => (
                                    <Link
                                        to={`/products/${item.productId}`}
                                        key={idx}
                                        className="checkout-item-row"
                                        style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                                    >
                                        <div className="item-thumb">
                                            <img src={(item.images && item.images[0]?.url) || ''} alt={item.title} />
                                        </div>
                                        <div className="item-details-compact">
                                            <h3 className="item-name-mini">{item.title}</h3>
                                            <div className="item-meta-row">
                                                {item.size && <span className="meta-tag">Size: {item.size}</span>}
                                                {item.color && <span className="meta-tag">Color: {item.color}</span>}
                                                <span className="meta-tag">Qty: {item.quantity}</span>
                                            </div>
                                            <p className="item-price-mini">₹{formatPrice(item.price)}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <div className="shipping-info-banner">
                                <Truck size={18} className="delivery-icon" />
                                <p>Free Standard Shipping: <strong>Arriving {currentAddress ? getDeliveryEstimation(currentAddress.zipCode).date : 'in 7 days'}</strong></p>
                            </div>
                        </div>
                    </section>
                </main>

                <aside className="checkout-sidebar">
                    <div className="order-summary-card">
                        <h2 className="summary-title">Order Summary</h2>

                        <div className="summary-rows">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{formatPrice(totalPrice)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                <span className="free-tag">Free</span>
                            </div>
                            <div className="summary-row">
                                <span>Estimated Tax</span>
                                <span>₹0.00</span>
                            </div>

                            <div className="summary-total-row">
                                <span>Order Total</span>
                                <span className="total-amount">₹{formatPrice(totalPrice)}</span>
                            </div>
                        </div>

                        <button
                            className={`btn-place-order-premium ${loading ? 'loading' : ''}`}
                            onClick={handlePlaceOrder}
                            disabled={loading || !currentAddress || !selectedPaymentMethod}
                        >
                            {loading ? (
                                <div className="loader-dots">
                                    <span></span><span></span><span></span>
                                </div>
                            ) : (
                                'Place Order'
                            )}
                        </button>

                        <div className="trust-badges">
                            <div className="badge-item">
                                <Lock size={12} />
                                <span>Secure</span>
                            </div>
                            <div className="badge-item">
                                <ShieldCheck size={12} />
                                <span>Buyer Protection</span>
                            </div>
                        </div>

                        <p className="disclaimer-mini">
                            By placing order, you agree to Threads' <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy</Link>.
                        </p>
                    </div>
                </aside>
            </div>

            {/* Address Form Modal - Premium Redesign */}
            {showAddressForm && (
                <div className="modal-overlay" onClick={() => setShowAddressForm(false)}>
                    <div className="premium-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="premium-modal-header">
                            <h2>{editingAddress ? 'Edit Address' : 'Add New Address'}</h2>
                            <button className="premium-modal-close" onClick={() => { setShowAddressForm(false); setEditingAddress(null); }}>×</button>
                        </div>

                        <div className="premium-modal-body">
                            {addressFormError && (
                                <div className="form-error">{addressFormError}</div>
                            )}

                            <div className="premium-form-group">
                                <label className="premium-label">ADDRESS TYPE *</label>
                                <div className="premium-select-wrapper">
                                    <select
                                        value={addressForm.addressType}
                                        onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value as 'default' | 'primary' | 'secondary' })}
                                        className="premium-input premium-select"
                                        disabled={!!editingAddress}
                                    >
                                        {getAvailableAddressTypes().map(type => (
                                            <option key={type} value={type}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="premium-select-arrow">▼</span>
                                </div>
                                <span className="premium-hint">First address will be your default</span>
                            </div>

                            <div className="premium-form-group">
                                <label className="premium-label">STREET ADDRESS *</label>
                                <input
                                    type="text"
                                    value={addressForm.street}
                                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                                    placeholder="123 Main Street, Apt 4B"
                                    className="premium-input"
                                />
                            </div>

                            <div className="premium-form-group">
                                <label className="premium-label">CITY *</label>
                                <input
                                    type="text"
                                    value={addressForm.city}
                                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                    placeholder="New York"
                                    className="premium-input"
                                />
                            </div>

                            <div className="premium-form-group">
                                <label className="premium-label">STATE *</label>
                                <input
                                    type="text"
                                    value={addressForm.state}
                                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                    placeholder="NY"
                                    className="premium-input"
                                />
                            </div>

                            <div className="premium-form-group">
                                <label className="premium-label">ZIP CODE *</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        value={addressForm.zipCode}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setAddressForm({ ...addressForm, zipCode: val });
                                            if (val.length === 6) verifyPincode(val);
                                        }}
                                        placeholder="6-digit ZIP code"
                                        className={`premium-input ${pincodeLoading ? 'loading' : ''}`}
                                        maxLength={6}
                                    />
                                    {pincodeLoading && (
                                        <div className="input-spinner-small" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}></div>
                                    )}
                                </div>
                                <span className="premium-hint">Automatically fetches City and State</span>
                                {pincodeInfo && (
                                    <small style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        marginTop: '0.4rem', color: pincodeInfo.includes('Invalid') ? '#ef4444' : '#10b981',
                                        fontWeight: 600, fontSize: '0.75rem'
                                    }}>
                                        {pincodeInfo.includes('Invalid') ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                                        {pincodeInfo}
                                    </small>
                                )}
                            </div>

                            <button
                                className="premium-btn-save"
                                onClick={handleAddAddress}
                            >
                                SAVE ADDRESS
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
