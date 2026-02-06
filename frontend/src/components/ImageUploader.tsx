import React, { useState } from 'react';
import { Upload, Loader2, Check } from 'lucide-react';

interface ImageUploaderProps {
    onUpload: (url: string) => void;
    className?: string;
    buttonText?: string;
}

export default function ImageUploader({ onUpload, className, buttonText = 'Upload' }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setSuccess(false);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('/api/v1/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (res.ok) {
                // Ensure URL is absolute or valid relative path
                onUpload(data.url);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 2000);
            } else {
                alert('Upload failed: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('Upload failed. Check server connection.');
        } finally {
            setUploading(false);
            // Reset input value so same file can be selected again
            e.target.value = '';
        }
    };

    return (
        <label
            className={`uploader-btn ${className || ''}`}
            style={{
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: success ? '#ecfdf5' : '#f8fafc',
                border: `1px solid ${success ? '#6ee7b7' : '#cbd5e1'}`,
                borderRadius: '6px',
                color: success ? '#059669' : '#475569',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
            }}
        >
            {uploading ? (
                <Loader2 className="animate-spin" size={16} />
            ) : success ? (
                <Check size={16} />
            ) : (
                <Upload size={16} />
            )}
            <span>{uploading ? 'Uploading...' : success ? 'Uploaded' : buttonText}</span>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                style={{ display: 'none' }}
            />
        </label>
    );
}
