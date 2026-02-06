import { useState } from 'react';
import { X } from 'lucide-react';
import '../styles/profile.css'; // Use profile styles for consistency

interface ReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => Promise<void>;
    title: string;
    placeholder: string;
    type: 'cancel' | 'return' | 'exchange';
}

export default function ReasonModal({ isOpen, onClose, onSubmit, title, placeholder, type }: ReasonModalProps) {
    const [reason, setReason] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!reason.trim() || reason.trim().length < 10) {
            setError('Please provide a valid reason (minimum 10 characters)');
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit(reason.trim());
            setReason('');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const getReasonSuggestions = () => {
        if (type === 'cancel') {
            return [
                'Changed my mind',
                'Found a better price elsewhere',
                'Ordered by mistake',
                'No longer need the item',
                'Shipping delay concerns'
            ];
        } else if (type === 'return') {
            return [
                'Item damaged or defective',
                'Wrong item received',
                'Size/color doesn\'t match description',
                'Quality not as expected',
                'Item doesn\'t fit'
            ];
        } else {
            return [
                'Wrong size',
                'Wrong color',
                'Want different variant',
                'Prefer different style',
                'Need different specifications'
            ];
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', paddingBottom: '5rem'
        }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                background: 'white', borderRadius: '16px', padding: '1.5rem',
                width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                position: 'relative', maxHeight: '80vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#111827' }}>{title}</h2>
                    <button onClick={onClose} style={{
                        border: 'none', background: 'transparent', cursor: 'pointer',
                        padding: '0.5rem', borderRadius: '50%', color: '#6b7280',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s'
                    }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block', textTransform: 'uppercase', fontSize: '0.75rem',
                            fontWeight: '700', color: '#6b7280', marginBottom: '0.5rem', letterSpacing: '0.05em'
                        }}>Reason *</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={placeholder}
                            rows={4}
                            required
                            style={{
                                width: '100%', padding: '1rem', border: '2px solid #e5e7eb',
                                borderRadius: '12px', fontSize: '0.95rem', fontWeight: '500',
                                color: '#111827', outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                                boxSizing: 'border-box', minHeight: '120px'
                            }}
                        />
                        <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Minimum 10 characters required</span>
                            <span>{reason.length} chars</span>
                        </p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>
                            Common reasons:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {getReasonSuggestions().map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setReason(suggestion)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        fontSize: '0.85rem',
                                        fontWeight: '500',
                                        background: reason === suggestion ? '#111827' : '#f3f4f6',
                                        border: 'none',
                                        borderRadius: '20px',
                                        cursor: 'pointer',
                                        color: reason === suggestion ? 'white' : '#4b5563',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            background: '#fee2e2', color: '#991b1b', padding: '0.75rem',
                            borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem',
                            border: '1px solid #fecaca'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="form-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '10px',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                background: 'white',
                                color: '#111827',
                                border: '2px solid #e5e7eb',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !reason.trim() || reason.trim().length < 10}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '10px',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                background: '#111827',
                                color: 'white',
                                border: 'none',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                opacity: (submitting || !reason.trim() || reason.trim().length < 10) ? 0.7 : 1,
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

