import { useState, useEffect } from 'react';
import { createProduct, updateProduct } from '../../services/adminProducts.api';
import { useNotification } from '../../context/NotificationContext';
import {
    ArrowLeft,
    Eye,
    Save,
    Package,
    Tag,
    Image as ImageIcon,
    DollarSign,
    Palette,
    BarChart3,
    Layers,
    Trash2,
    Plus,
    Camera,
    X,
    MapPin,
    AlertCircle,
    Info
} from 'lucide-react';
import ImageUploader from '../../components/ImageUploader';
import { ProductDetailsView } from '../ProductDetails';
import type { Product } from '../ProductDetails';

const QUICK_COLORS = [
    { name: 'Red', hex: '#ef4444' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Green', hex: '#10b981' },
    { name: 'Yellow', hex: '#f59e0b' },
    { name: 'Purple', hex: '#8b5cf6' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Gray', hex: '#6b7280' },
    { name: 'Orange', hex: '#f97316' },
];

export default function AdminProductForm({ product, onDone }: any) {
    // State for active tab tracking
    const [activeTab, setActiveTab] = useState('details');

    const [title, setTitle] = useState(product?.title ?? '');
    const [slug, setSlug] = useState(product?.slug ?? '');
    const [description, setDescription] = useState(product?.description ?? '');
    const [price, setPrice] = useState(
        product ? product.price.amount / 100 : ''
    );
    const [imageUrl, setImageUrl] = useState(product?.images?.[0]?.url ?? '');
    const [mainImageColor, setMainImageColor] = useState(product?.images?.[0]?.color ?? '');
    const [stock, setStock] = useState(product?.stock ?? 0);

    const [loading, setLoading] = useState(false);
    const [isSlugManual, setIsSlugManual] = useState(false);
    const [sizes, setSizes] = useState(product?.sizes?.join(', ') ?? '');
    const [colors, setColors] = useState(product?.colors?.join(', ') ?? '');

    // Category State
    const [categories, setCategories] = useState<any[]>([]);
    const [parentCategory, setParentCategory] = useState(product?.parentCategoryId ?? '');
    const [childCategory, setChildCategory] = useState(product?.childCategoryId ?? '');
    const [sellerZipCode, setSellerZipCode] = useState(product?.sellerZipCode ?? '110001');
    const [zipLoading, setZipLoading] = useState(false);
    const [zipInfo, setZipInfo] = useState('');

    // ✅ NEW FIELDS
    const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
    const [discountPercentage, setDiscountPercentage] = useState(product?.discountPercentage ?? 0);
    const [additionalImages, setAdditionalImages] = useState<Array<{ url: string; altText: string; color?: string }>>(
        product?.images?.slice(1) ?? []
    );
    const [variants, setVariants] = useState<Array<{ size: string; color: string; stock: number; reservedStock?: number }>>(
        product?.variants ?? []
    );
    const [showPreview, setShowPreview] = useState(false);

    const { notify } = useNotification();

    // Switch Tab
    const scrollToSection = (id: string) => {
        setActiveTab(id);
        window.scrollTo({ top: 0, behavior: 'instant' });
    };

    // Fetch categories on mount
    useEffect(() => {
        fetch('/api/v1/categories')
            .then(res => res.json())
            .then(data => setCategories(data || []))
            .catch(err => console.error('Failed to load categories', err));
    }, []);

    // Derived state for category filtering
    const parentCategories = categories.filter(c => !c.parentId);
    const childCategories = categories.filter(c => c.parentId === parentCategory);

    // Auto-generate slug from title
    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);
        if (!product && !isSlugManual) {
            const autoSlug = newTitle
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-');
            setSlug(autoSlug);
        }
    };

    async function submit(e: React.FormEvent) {
        e.preventDefault();

        // ✅ MANUAL FORM VALIDATION (Required for tabbed view)
        if (!title.trim()) {
            notify('Product Title is required', 'error');
            setActiveTab('details');
            return;
        }
        if (!slug.trim()) {
            notify('Slug is required', 'error');
            setActiveTab('details');
            return;
        }
        if (!price || Number(price) <= 0) {
            notify('Valid Base Price is required', 'error');
            setActiveTab('pricing');
            return;
        }

        const wordCount = description.trim().split(/\s+/).length;
        if (wordCount < 20) {
            notify('Description must be at least 20 words', 'error');
            setActiveTab('details');
            return;
        }

        if (!parentCategory || !childCategory) {
            notify('Please select both parent and child categories', 'error');
            setActiveTab('classification');
            return;
        }

        // ✅ CLIENT-SIDE VALIDATION: Variants
        const completeVariants = variants.filter(v => v.size && v.color);

        if (completeVariants.length > 0) {
            // Check for duplicates
            const seenCombos = new Set<string>();
            const variantColors = new Set<string>();
            const variantSizes = new Set<string>();

            for (let i = 0; i < completeVariants.length; i++) {
                const variant = completeVariants[i];
                const combo = `${variant.size.trim().toLowerCase()}-${variant.color.trim().toLowerCase()}`;

                if (seenCombos.has(combo)) {
                    notify(`Duplicate variant found: ${variant.size} / ${variant.color}. Please remove duplicates.`, 'error');
                    setActiveTab('variants');
                    return;
                }
                seenCombos.add(combo);
                variantColors.add(variant.color.trim().toLowerCase());
                variantSizes.add(variant.size.trim().toLowerCase());

                // Validate stock
                if (Number(variant.stock) < 0) {
                    notify(`Variant ${variant.size}/${variant.color}: Stock cannot be negative`, 'error');
                    setActiveTab('variants');
                    return;
                }
            }

            // ✅ CLIENT-SIDE VALIDATION: Images (colors must match variants)
            const allImages = [
                { url: imageUrl, altText: title, color: mainImageColor || undefined },
                ...additionalImages
            ];

            for (let i = 0; i < allImages.length; i++) {
                const image = allImages[i];
                if (image.color) {
                    const imgColor = image.color.trim().toLowerCase();
                    if (!variantColors.has(imgColor)) {
                        const availableColors = Array.from(variantColors).join(', ');
                        notify(
                            `Image ${i + 1}: Color "${image.color}" doesn't match any variant. Available colors: ${availableColors}`,
                            'error'
                        );
                        setActiveTab('media');
                        return;
                    }
                }
            }
        }

        setLoading(true);
        try {
            // Build images array: main image + additional images
            const allImages = [
                { url: imageUrl, altText: title, color: mainImageColor || undefined },
                ...additionalImages
            ];

            const payload: any = {
                title,
                slug: product ? undefined : (slug || title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')),
                description,
                price: { amount: Number(price) * 100, currency: 'INR' },
                images: allImages,
                thumbnailUrl: imageUrl,
                stock: Number(stock),
                sizes: sizes.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0),
                colors: colors.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0),
                parentCategoryId: parentCategory,
                childCategoryId: childCategory,
                isFeatured: isFeatured,
                discountPercentage: Number(discountPercentage) || 0,
                sellerZipCode,
                variants: completeVariants.map(v => ({
                    ...v,
                    stock: Number(v.stock),
                    reservedStock: v.reservedStock || 0,
                    availableStock: Number(v.stock) - (v.reservedStock || 0)
                }))
            };

            if (product) {
                await updateProduct(product.id, payload);
                notify('Product updated successfully!', 'success');
            } else {
                await createProduct(payload);
                notify('Product created successfully!', 'success');
            }
            onDone();
        } catch (error: any) {
            console.error('Failed to save product:', error);
            // Display detailed backend error message
            const errorMessage = error.response?.data?.message || error.message || 'Failed to save product';
            notify(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }

    const SNEAKER_SIZES = ['US 6', 'US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12', 'US 13'];
    const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    // Helper to toggle size
    const toggleSize = (s: string) => {
        const currentSizes = sizes.split(',').map((s: string) => s.trim()).filter(Boolean);
        let newSizes;
        if (currentSizes.includes(s)) {
            newSizes = currentSizes.filter((item: string) => item !== s);
        } else {
            newSizes = [...currentSizes, s];
        }
        setSizes(newSizes.join(', '));
    };

    // Helper to add variant
    const addVariant = () => {
        const newVariant = { size: '', color: '', stock: 0 };
        setVariants([...variants, newVariant]);
    };

    // Helper to remove variant
    const removeVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    // Helper to update variant
    const updateVariant = (index: number, field: string, value: any) => {
        const updated = [...variants];
        updated[index] = { ...updated[index], [field]: value };
        setVariants(updated);
    };

    // Helper to add image
    const addImage = () => {
        setAdditionalImages([...additionalImages, { url: '', altText: '', color: '' }]);
    };

    // Helper to remove image
    const removeImage = (index: number) => {
        setAdditionalImages(additionalImages.filter((_, i) => i !== index));
    };

    // Helper to update image
    const updateImage = (index: number, field: string, value: string) => {
        const updated = [...additionalImages];
        updated[index] = { ...updated[index], [field]: value };
        setAdditionalImages(updated);
    };

    // Auto-generate variants from Sizes and Colors
    const generateVariants = () => {
        const sizeList = sizes.split(',').map((s: string) => s.trim()).filter(Boolean);
        const colorList = colors.split(',').map((c: string) => c.trim()).filter(Boolean);

        if (sizeList.length === 0 || colorList.length === 0) {
            notify("Please ensure 'Sizes' and 'Colors' fields are filled above", "error");
            return;
        }

        const confirm = window.confirm("This will regenerate the variant list based on your Sizes and Colors. Existing stock for matching variants will be kept, but others may be removed. Continue?");
        if (!confirm) return;

        const newVariants: Array<{ size: string; color: string; stock: number }> = [];

        // Generate combinations
        sizeList.forEach((s: string) => {
            colorList.forEach((c: string) => {
                // Check for existing variant to preserve stock
                const existing = variants.find(v =>
                    v.size.trim().toLowerCase() === s.toLowerCase() &&
                    v.color.trim().toLowerCase() === c.toLowerCase()
                );

                newVariants.push({
                    size: s,
                    color: c,
                    stock: existing ? existing.stock : 0
                });
            });
        });

        setVariants(newVariants);
        notify(`Generated ${newVariants.length} variant combinations. Please update stock levels.`, "success");
    };

    // Auto-generate image slots for colors
    const generateColorImages = () => {
        const colorList = colors.split(',').map((c: string) => c.trim()).filter(Boolean);
        if (colorList.length === 0) {
            notify("Please define 'Colors' in the Variants tab first", "error");
            return;
        }

        const newImages = colorList.map((c: any) => ({
            url: '',
            altText: `${title} - ${c}`,
            color: c
        }));

        setAdditionalImages([...additionalImages, ...newImages]);
        notify(`Added ${newImages.length} image slots for colors.`, "success");
    };

    const verifySellerPincode = async (code: string) => {
        if (!/^\d{6}$/.test(code)) return;
        setZipLoading(true);
        setZipInfo('');
        try {
            const res = await fetch(`https://api.postalpincode.in/pincode/${code}`);
            const data = await res.json();
            if (data[0].Status === "Success") {
                const details = data[0].PostOffice[0];
                setZipInfo(`${details.District}, ${details.State}`);
                notify(`Location identified: ${details.District}, ${details.State}`, 'success');
            } else {
                setZipInfo('Invalid ZIP Code');
            }
        } catch (err) {
            console.error('Pincode API failed', err);
        } finally {
            setZipLoading(false);
        }
    };

    const getPreviewProduct = (): Product => {
        const preview: any = {
            _id: product?.id || 'preview-id',
            title: title || 'Untitled Product',
            description: description || 'No description provided.',
            price: {
                amount: (parseFloat(price.toString()) || 0) * 100,
                currency: 'INR'
            },
            stock: Number(stock) || 0,
            slug: slug || 'preview-slug',
            sizes: sizes.split(',').map((s: string) => s.trim()).filter(Boolean),
            colors: colors.split(',').map((c: string) => c.trim()).filter(Boolean),
            images: [
                { url: imageUrl, altText: title, color: mainImageColor },
                ...additionalImages
            ].filter(img => img.url),
            variants: variants,
            parentCategory: parentCategories.find(c => c._id === parentCategory) ? { name: parentCategories.find(c => c._id === parentCategory).name, slug: 'cat' } : undefined,
            childCategory: childCategories.find(c => c._id === childCategory) ? { name: childCategories.find(c => c._id === childCategory).name, slug: 'subcat' } : undefined,
        };
        return preview;
    };

    const TABS = [
        { id: 'details', label: 'Details', icon: Package },
        { id: 'classification', label: 'Classification', icon: Tag },
        { id: 'media', label: 'Media', icon: ImageIcon },
        { id: 'pricing', label: 'Pricing', icon: DollarSign },
        { id: 'variants', label: 'Variants', icon: Palette },
        { id: 'stock', label: 'Stock', icon: BarChart3 },
    ];

    return (
        <form onSubmit={submit} className="admin-form">

            {/* STICKY HEADER */}
            <header className="admin-page-header">
                <div className="header-left">
                    <button type="button" className="btn-back" onClick={onDone} title="Back">
                        <ArrowLeft />
                    </button>
                    <div className="header-title">
                        <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
                        <p className="header-subtitle">Update product information and settings</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button
                        type="button"
                        className="btn-preview"
                        onClick={() => setShowPreview(true)}
                    >
                        <Eye size={18} /> Preview
                    </button>
                    <button type="submit" className="btn-save" disabled={loading}>
                        <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </header>

            {/* TABS */}
            <div className="admin-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => scrollToSection(tab.id)}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT - SCROLLABLE LAYOUT */}
            <div className="admin-form-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* 1. DETAILS */}
                {activeTab === 'details' && (
                    <div id="details" className="scroll-section">
                        <div className="admin-form-section">
                            <h3 className="section-title">Product Details</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label>Product Title</label>
                                    <input
                                        className="form-input"
                                        placeholder="e.g. Air Jordan 1 Retro High"
                                        value={title}
                                        onChange={(e) => handleTitleChange(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Slug (URL Identifier)</label>
                                    <input
                                        className="form-input"
                                        placeholder="e.g. air-jordan-1-retro"
                                        value={slug}
                                        onChange={(e) => {
                                            setSlug(e.target.value);
                                            setIsSlugManual(true);
                                        }}
                                        required
                                        disabled={!!product}
                                    />
                                    {product && <small className="text-muted">Slug cannot be changed after creation.</small>}
                                </div>

                                <div className="form-group">
                                    <label>Description (Min 20 words)</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Detailed product description..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                        style={{ minHeight: '120px' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', border: '1px solid var(--admin-border)', borderRadius: '8px', maxWidth: 'fit-content' }}>
                                        <input
                                            type="checkbox"
                                            checked={isFeatured}
                                            onChange={(e) => setIsFeatured(e.target.checked)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--admin-primary)' }}
                                        />
                                        <span style={{ fontWeight: 500 }}>Featured Product</span>
                                    </label>
                                    <small className="text-muted" style={{ display: 'block', marginTop: '0.5rem' }}>Show on homepage and featured sections</small>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. CLASSIFICATION */}
                {activeTab === 'classification' && (
                    <div id="classification" className="scroll-section">
                        <div className="admin-form-section">
                            <h3 className="section-title">Classification</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label>Parent Category</label>
                                    <select
                                        className="form-select"
                                        value={parentCategory}
                                        onChange={(e) => {
                                            setParentCategory(e.target.value);
                                            setChildCategory('');
                                        }}
                                        required
                                    >
                                        <option value="">Select Parent...</option>
                                        {parentCategories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Child Category</label>
                                    <select
                                        className="form-select"
                                        value={childCategory}
                                        onChange={(e) => setChildCategory(e.target.value)}
                                        required
                                        disabled={!parentCategory}
                                    >
                                        <option value="">Select Child...</option>
                                        {childCategories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                <label>Seller ZIP Code (Pickup Location)</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="form-input"
                                        placeholder="e.g. 110001"
                                        value={sellerZipCode}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setSellerZipCode(val);
                                            if (val.length === 6) verifySellerPincode(val);
                                        }}
                                        maxLength={6}
                                        required
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
                                <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>Determines delivery estimation for buyers based on distance.</small>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. MEDIA */}
                {activeTab === 'media' && (
                    <div id="media" className="scroll-section">
                        <div className="admin-form-section">
                            <h3 className="section-title">Media & Images</h3>

                            {/* Information Box */}
                            {variants.some(v => v.size && v.color) && (
                                <div style={{
                                    padding: '1rem',
                                    backgroundColor: '#f0f9ff',
                                    border: '1px solid #bae6fd',
                                    borderRadius: '8px',
                                    marginBottom: '1.5rem',
                                    fontSize: '0.875rem',
                                    lineHeight: '1.5'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                        <Info size={18} style={{ color: '#0369a1', marginTop: '2px', flexShrink: 0 }} />
                                        <div>
                                            <strong style={{ color: '#0369a1' }}>Image Color Validation:</strong> If you assign a color to an image, it must match one of your product variants.
                                            <div style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                                                <strong>Available colors:</strong> {
                                                    Array.from(new Set(
                                                        variants
                                                            .filter(v => v.color && v.size)
                                                            .map(v => v.color)
                                                    )).join(', ') || 'None (add variants first)'
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '1rem' }}>
                                    <div>
                                        <label style={{ marginBottom: '0.5rem', display: 'block' }}>Default / Cover Image URL</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                className="form-input"
                                                placeholder="https://... or upload"
                                                value={imageUrl}
                                                onChange={(e) => setImageUrl(e.target.value)}
                                                required
                                                style={{ flex: 1 }}
                                            />
                                            <ImageUploader onUpload={setImageUrl} buttonText="Upload" />
                                        </div>
                                    </div>
                                    <div>
                                        <label>Color *</label>
                                        <input
                                            className="form-input"
                                            placeholder="e.g. Black"
                                            value={mainImageColor}
                                            onChange={(e) => setMainImageColor(e.target.value)}
                                        />
                                    </div>
                                </div>
                                {imageUrl && (
                                    <div style={{ marginTop: '1rem', height: '200px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--admin-border)', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img src={imageUrl} alt="Main Preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                    </div>
                                )}
                            </div>

                            <h4 className="section-title" style={{ fontSize: '1rem', marginTop: '2rem' }}>Color-Specific Images</h4>
                            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                                Add images for specific colors. When a user selects a color, the corresponding image will be shown.
                            </p>

                            {additionalImages.map((image, index) => (
                                <div key={index} className="image-card">
                                    <div className="image-card-header">
                                        <div className="image-card-title">
                                            <span style={{ opacity: 0.5 }}>::</span> Additional Image {index + 1}
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-delete"
                                            onClick={() => removeImage(index)}
                                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                        >
                                            <Trash2 size={14} /> Remove
                                        </button>
                                    </div>

                                    <div className="image-card-body">
                                        <div className="image-preview-area">
                                            {image.url ? (
                                                <img src={image.url} alt="Preview" onError={(e: any) => e.target.style.display = 'none'} />
                                            ) : (
                                                <>
                                                    <div className="preview-icon"><Camera size={24} /></div>
                                                    <span className="preview-text">Upload Image</span>
                                                </>
                                            )}
                                        </div>

                                        <div className="image-inputs-grid">
                                            <div className="form-group">
                                                <label className="secondary-text" style={{ marginBottom: '0.5rem', display: 'block' }}>Image URL</label>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <input
                                                        type="text"
                                                        className="form-input force-visible-input"
                                                        placeholder="https://... or upload"
                                                        value={image.url || ''}
                                                        onChange={(e) => updateImage(index, 'url', e.target.value)}
                                                        style={{ flex: 1 }}
                                                    />
                                                    <ImageUploader onUpload={(url) => updateImage(index, 'url', url)} buttonText="Upload" />
                                                </div>
                                            </div>

                                            <div className="input-row">
                                                <div className="form-group">
                                                    <label className="secondary-text">Alt Text</label>
                                                    <input
                                                        type="text"
                                                        className="form-input force-visible-input"
                                                        placeholder="e.g. Red sneakers front view"
                                                        value={image.altText || ''}
                                                        onChange={(e) => updateImage(index, 'altText', e.target.value)}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="secondary-text">Color (Optional)</label>
                                                    <input
                                                        type="text"
                                                        className="form-input force-visible-input"
                                                        placeholder="e.g. White"
                                                        value={image.color || ''}
                                                        onChange={(e) => updateImage(index, 'color', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <span className="quick-color-label">Quick Select Color</span>
                                                <div className="color-swatches">
                                                    {QUICK_COLORS.map(c => (
                                                        <div
                                                            key={c.name}
                                                            className="color-swatch-btn"
                                                            onClick={() => updateImage(index, 'color', c.name)}
                                                            style={image.color === c.name ? { borderColor: 'var(--admin-primary)', background: '#f0f9ff' } : {}}
                                                        >
                                                            <div className="color-dot" style={{ background: c.hex }}></div>
                                                            <span className="color-name">{c.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    className="btn-dashed"
                                    onClick={addImage}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <Plus size={18} /> Add Single Image
                                </button>
                                <button
                                    type="button"
                                    className="btn-dashed"
                                    onClick={generateColorImages}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderColor: 'var(--admin-primary)', color: 'var(--admin-primary)', background: '#f0f9ff' }}
                                >
                                    <Camera size={18} /> Auto-Generate Color Slots
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. PRICING */}
                {activeTab === 'pricing' && (
                    <div id="pricing" className="scroll-section">
                        <div className="admin-form-section">
                            <h3 className="section-title">Pricing</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label>Base Price (₹)</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        placeholder="0.00"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Discount % (Optional)</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="0"
                                        value={discountPercentage}
                                        onChange={(e) => setDiscountPercentage(e.target.value)}
                                    />
                                    <small className="text-muted">Percentage off the listed price</small>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. VARIANTS */}
                {activeTab === 'variants' && (
                    <div id="variants" className="scroll-section">
                        <div className="admin-form-section">
                            <h3 className="section-title">Product Variants</h3>

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label>Available Sizes</label>
                                <div className="size-selector-container">
                                    {SNEAKER_SIZES.map(s => (
                                        <button
                                            type="button"
                                            key={s}
                                            className={`size-pill ${sizes.includes(s) ? 'selected' : ''}`}
                                            onClick={() => toggleSize(s)}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                    {APPAREL_SIZES.map(s => (
                                        <button
                                            type="button"
                                            key={s}
                                            className={`size-pill ${sizes.includes(s) ? 'selected' : ''}`}
                                            onClick={() => toggleSize(s)}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ marginTop: '0.75rem' }}>
                                    <label style={{ fontSize: '0.7rem', marginBottom: '0.25rem' }}>Custom / Manual Sizes</label>
                                    <input
                                        className="form-input"
                                        placeholder="Manually add sizes (comma separated)..."
                                        value={sizes}
                                        onChange={(e) => setSizes(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label>Colors <small className="text-muted">(Comma separated)</small></label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. Red, Navy, Black"
                                    value={colors}
                                    onChange={(e) => setColors(e.target.value)}
                                />
                            </div>

                            <h4 className="section-title" style={{ fontSize: '1rem', marginTop: '2rem' }}>Variant Stock Management</h4>
                            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                                Manage stock for each size/color combination. Leave empty to use total stock.
                            </p>

                            {Array.isArray(variants) && variants.map((variant, index) => (
                                <div key={index} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 1fr auto',
                                    gap: '1rem',
                                    marginBottom: '1rem',
                                    padding: '1rem',
                                    background: 'var(--admin-card-bg)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--admin-border)'
                                }}>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.8rem' }}>Size</label>
                                        <input
                                            type="text"
                                            className="form-input force-visible-input"
                                            placeholder="e.g. US 10"
                                            value={variant.size || ''}
                                            onChange={(e) => updateVariant(index, 'size', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.8rem' }}>Color</label>
                                        <input
                                            type="text"
                                            className="form-input force-visible-input"
                                            placeholder="e.g. Black"
                                            value={variant.color || ''}
                                            onChange={(e) => updateVariant(index, 'color', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.8rem' }}>Stock</label>
                                        <input
                                            type="number"
                                            className="form-input force-visible-input"
                                            min="0"
                                            placeholder="0"
                                            value={variant.stock || ''}
                                            onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.8rem', visibility: 'hidden' }}>Action</label>
                                        <button
                                            type="button"
                                            className="btn-delete"
                                            onClick={() => removeVariant(index)}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                fontSize: '0.85rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                height: '100%',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Trash2 size={14} /> Remove
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    className="btn-dashed"
                                    onClick={addVariant}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <Plus size={18} /> Add Single Variant
                                </button>
                                <button
                                    type="button"
                                    className="btn-dashed"
                                    onClick={generateVariants}
                                    style={{ flex: 1, borderColor: 'var(--admin-primary)', color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#f0f9ff' }}
                                >
                                    <Layers size={18} /> Auto-Generate Combinations
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. STOCK */}
                {activeTab === 'stock' && (
                    <div id="stock" className="scroll-section">
                        <div className="admin-form-section">
                            <h3 className="section-title">Inventory Overview</h3>
                            <div className="form-group">
                                <label>Total Stock Quantity</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    required
                                />
                                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', display: 'flex', gap: '2rem' }}>
                                    <span className="text-muted">Reserved: <strong>{product?.reservedStock || 0}</strong></span>
                                    <span className="status-success" style={{ color: 'var(--admin-success)' }}>Available: <strong>{product ? (product.stock - (product.reservedStock || 0)) : 0}</strong></span>
                                </div>
                                <p className="text-muted" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                                    Note: If variants are defined with specific stock levels, they will be tracked individually. This total stock value serves as a fallback or aggregate for simple products.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            </div> {/* End of admin-form-content */}



            {/* PREVIEW MODAL */}
            {showPreview && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 9999,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '2rem'
                }}>
                    <div style={{
                        background: '#fff',
                        width: '100%',
                        maxWidth: '1200px',
                        height: '90vh',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            padding: '1rem 1.5rem',
                            borderBottom: '1px solid #f0f0f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#fff'
                        }}>
                            <h3 style={{ margin: 0 }}>Product Preview</h3>
                            <button
                                type="button"
                                onClick={() => setShowPreview(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                            <ProductDetailsView product={getPreviewProduct()} isPreview={true} />
                        </div>
                    </div>
                </div>
            )}

        </form>
    );
}
