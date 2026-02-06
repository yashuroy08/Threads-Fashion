import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductGridSkeleton } from '../components/SkeletonLoader';
import Breadcrumb from '../components/Breadcrumb';
import ProductCard from '../components/ProductCard';
import { FilterGroup, CheckboxFilter, ColorFilter, PriceRangeFilter, SortDropdown } from '../components/FilterComponents';

import { SlidersHorizontal, X } from 'lucide-react';

import '../styles/products.css';
import '../styles/filters.css';

// Custom type for this page (should idealy be shared)
type Product = {
    inStock: any;
    isNew: any;
    id: string;
    _id?: string;
    slug: string;
    title: string;
    price: {
        amount: number;
        currency: string;
    };
    images: {
        url: string;
        altText?: string;
        color?: string;
    }[];
    sizes?: string[];
    colors?: string[];
    isFeatured?: boolean;
    discountPercentage?: number;
};

// Static Filter Options
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = ['Black', 'White', 'Blue', 'Red', 'Green', 'Yellow', 'Grey', 'Beige', 'Brown', 'Navy'];
const SORT_OPTIONS = [
    { label: 'New Arrivals', value: 'newest' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Featured', value: 'featured' }
];

export default function Products() {
    // Data State
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [parentCategories, setParentCategories] = useState<{ _id: string, name: string, slug: string }[]>([]);
    const [childCategories, setChildCategories] = useState<{ _id: string, name: string, slug: string, parentId: string }[]>([]);

    // Router State
    const [searchParams, setSearchParams] = useSearchParams();

    // Filter State
    const [filters, setFilters] = useState({
        sizes: [] as string[],
        colors: [] as string[],
        minPrice: '',
        maxPrice: ''
    });
    const [sortBy, setSortBy] = useState('newest');
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    // Lock body scroll and hide bottom nav when mobile filters are open
    useEffect(() => {
        if (mobileFiltersOpen) {
            document.body.classList.add('mobile-filters-active');
        } else {
            document.body.classList.remove('mobile-filters-active');
        }
        return () => document.body.classList.remove('mobile-filters-active');
    }, [mobileFiltersOpen]);

    // URL Params
    const parentCategoryParam = searchParams.get('parentCategory');
    const childCategoryParam = searchParams.get('childCategory');
    const categorySlug = searchParams.get('category');
    const query = (searchParams.get('q') || '').trim();



    // Initialize state from URL on mount
    useEffect(() => {
        const sizeParam = searchParams.get('sizes');
        const colorParam = searchParams.get('colors');
        const minParam = searchParams.get('minPrice');
        const maxParam = searchParams.get('maxPrice');
        const sortParam = searchParams.get('sort');

        setFilters({
            sizes: sizeParam ? sizeParam.split(',') : [],
            colors: colorParam ? colorParam.split(',') : [],
            minPrice: minParam || '',
            maxPrice: maxParam || ''
        });

        if (sortParam) setSortBy(sortParam);
    }, [searchParams]);

    // Update URL when filters change
    const updateUrl = (newFilters: typeof filters, newSort: string) => {
        const params = new URLSearchParams(searchParams);

        // Preserve category params
        if (parentCategoryParam) params.set('parentCategory', parentCategoryParam);
        if (childCategoryParam) params.set('childCategory', childCategoryParam);
        if (categorySlug) params.set('category', categorySlug);
        if (query) params.set('q', query);

        // Handle Arrays
        if (newFilters.sizes.length) params.set('sizes', newFilters.sizes.join(','));
        else params.delete('sizes');

        if (newFilters.colors.length) params.set('colors', newFilters.colors.join(','));
        else params.delete('colors');

        // Handle Price
        if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice);
        else params.delete('minPrice');

        if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice);
        else params.delete('maxPrice');

        // Handle Sort
        if (newSort !== 'newest') params.set('sort', newSort);
        else params.delete('sort');

        setSearchParams(params);
    };

    // Filter Handlers
    const handleSizeChange = (size: string) => {
        const newSizes = filters.sizes.includes(size)
            ? filters.sizes.filter(s => s !== size)
            : [...filters.sizes, size];

        const newFilters = { ...filters, sizes: newSizes };
        setFilters(newFilters);
        updateUrl(newFilters, sortBy);
    };

    const handleColorChange = (color: string) => {
        const newColors = filters.colors.includes(color)
            ? filters.colors.filter(c => c !== color)
            : [...filters.colors, color];

        const newFilters = { ...filters, colors: newColors };
        setFilters(newFilters);
        updateUrl(newFilters, sortBy);
    };

    const handlePriceChange = (min: number, max: number) => {
        const newFilters = {
            ...filters,
            minPrice: min ? min.toString() : '',
            maxPrice: max ? max.toString() : ''
        };
        setFilters(newFilters);
        updateUrl(newFilters, sortBy);
    };



    const clearFilters = () => {
        const emptyFilters = { sizes: [], colors: [], minPrice: '', maxPrice: '' };
        setFilters(emptyFilters);
        setSortBy('newest');
        updateUrl(emptyFilters, 'newest');
        setMobileFiltersOpen(false);
    };

    // Fetch Categories
    useEffect(() => {
        fetch('/api/v1/categories')
            .then(res => res.json())
            .then(data => {
                const allCategories = data || [];
                setParentCategories(allCategories.filter((cat: any) => !cat.parentId));
                setChildCategories(allCategories.filter((cat: any) => cat.parentId));
            })
            .catch(err => console.error(err));
    }, []);

    // Fetch Products
    useEffect(() => {
        if (categorySlug && parentCategories.length === 0 && childCategories.length === 0) return;

        setLoading(true);
        const searchQuery = query ? `&q=${encodeURIComponent(query)}` : '';

        // Base Query
        let url = `/api/v1/products?limit=20${searchQuery}`;

        // Category Resolution
        let targetParentId = "";
        let targetChildId = "";

        // Check explicit parent/child params first (new structure)
        if (parentCategoryParam) {
            const p = parentCategories.find(c => c.slug === parentCategoryParam || c._id === parentCategoryParam);
            if (p) targetParentId = p._id;
        }
        if (childCategoryParam) {
            const c = childCategories.find(c => c.slug === childCategoryParam || c._id === childCategoryParam);
            if (c) targetChildId = c._id;
        }

        // Check fallback generic category param
        if (categorySlug && !targetParentId && !targetChildId) {
            const parent = parentCategories.find(c => c.slug === categorySlug);
            if (parent) targetParentId = parent._id;
            else {
                const child = childCategories.find(c => c.slug === categorySlug);
                if (child) targetChildId = child._id;
            }
        }

        if (targetChildId) url += `&childCategory=${targetChildId}`;
        else if (targetParentId) url += `&parentCategory=${targetParentId}`;

        // Append Filters
        if (filters.sizes.length) url += `&sizes=${filters.sizes.join(',')}`;
        if (filters.colors.length) url += `&colors=${filters.colors.join(',')}`;
        if (filters.minPrice) url += `&minPrice=${filters.minPrice}`;
        if (filters.maxPrice) url += `&maxPrice=${filters.maxPrice}`;
        if (sortBy) url += `&sort=${sortBy}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                const items = (data.items || []) as Product[];
                const filtered = items.filter(
                    (p) => Array.isArray(p.images) && p.images[0] && !!p.images[0].url
                );
                setProducts(filtered);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [parentCategoryParam, childCategoryParam, categorySlug, query, parentCategories, childCategories, filters, sortBy]);

    // Helper: Display Name
    const getCategoryDisplayName = () => {
        if (query) return `Results for "${query}"`;

        // Try child first as it's more specific
        const childSlug = childCategoryParam || categorySlug;
        const child = childCategories.find(c => c.slug === childSlug || c._id === childSlug);
        if (child) return child.name;

        const parentSlug = parentCategoryParam || categorySlug;
        const parent = parentCategories.find(c => c.slug === parentSlug || c._id === parentSlug);
        if (parent) return parent.name;

        return 'The Collection';
    };

    const categoryDisplayName = getCategoryDisplayName();

    // Helper: Breadcrumbs
    const getBreadcrumbItems = () => {
        const items = [];

        if (query) {
            items.push({ label: 'Search Results', href: '/products' });
            items.push({ label: `"${query}"`, href: '#' });
            return items;
        }

        const childIdOrSlug = childCategoryParam || categorySlug;
        const child = childCategories.find(c => c.slug === childIdOrSlug || c._id === childIdOrSlug);

        const parentIdOrSlug = parentCategoryParam || categorySlug;
        const parent = parentCategories.find(c => c.slug === parentIdOrSlug || c._id === parentIdOrSlug);

        if (child) {
            const parentOfChild = parentCategories.find(p => p._id === child.parentId);
            if (parentOfChild) {
                items.push({ label: parentOfChild.name, href: `/products?parentCategory=${parentOfChild.slug}` });
            }
            items.push({ label: child.name, href: `/products?childCategory=${child.slug}` });
        } else if (parent) {
            items.push({ label: parent.name, href: `/products?parentCategory=${parent.slug}` });
        } else {
            items.push({ label: 'All Products', href: '/products' });
        }

        return items;
    };



    return (
        <div className="products-page">
            <div className="container" style={{ maxWidth: '1400px', display: 'flex', gap: '3rem' }}>

                {/* Desktop Sidebar */}
                <aside className="filters-sidebar desktop-only" style={{ width: '280px', flexShrink: 0 }}>
                    <div>
                        <h3 className="heading-sm">Filters</h3>
                    </div>
                    <FilterGroup title="Size">
                        <CheckboxFilter
                            options={SIZES}
                            selected={filters.sizes}
                            onChange={handleSizeChange}
                        />
                    </FilterGroup>

                    <FilterGroup title="Color">
                        <ColorFilter
                            colors={COLORS}
                            selected={filters.colors}
                            onChange={handleColorChange}
                        />
                    </FilterGroup>

                    <FilterGroup title="Price Range">
                        <PriceRangeFilter
                            min={Number(filters.minPrice)}
                            max={Number(filters.maxPrice)}
                            onChange={handlePriceChange}
                        />
                    </FilterGroup>
                    {(filters.sizes.length > 0 || filters.colors.length > 0 || filters.minPrice) && (
                        <button onClick={clearFilters} className="btn-clear" style={{ marginTop: '1rem', width: '100%' }}>Clear All</button>
                    )}
                </aside>

                <div style={{ flex: 1 }}>
                    <div className="collection-header">
                        <div className="desktop-only" style={{ marginBottom: '1rem' }}>
                            <Breadcrumb items={getBreadcrumbItems()} />
                        </div>

                        <div className="header-content">
                            <div className="header-title-section">
                                <h1>
                                    {categoryDisplayName || (query ? `Results for "${query}"` : 'The Collection')}
                                </h1>
                                <p className="header-subtitle">Timeless pieces designed for the modern wardrobe.</p>
                            </div>

                            <div className="header-controls">
                                <span className="item-count">{products.length} items</span>
                                <SortDropdown
                                    options={SORT_OPTIONS}
                                    value={sortBy}
                                    onChange={(val) => {
                                        setSortBy(val);
                                        updateUrl(filters, val);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {loading ? <ProductGridSkeleton /> : (
                        <div className="products-grid">
                            {products.length === 0 ? (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 0' }}>
                                    <p className="heading-md" style={{ color: 'var(--fashion-muted)', marginBottom: '1rem' }}>No products found matching your filters.</p>
                                    <button
                                        onClick={clearFilters}
                                        style={{ textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none' }}
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            ) : (
                                products.map((product) => (
                                    <ProductCard product={product} key={product.id} />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Filter FAB */}
            <button className="mobile-filter-fab" onClick={() => setMobileFiltersOpen(true)}>
                <SlidersHorizontal size={20} />
                <span>Filters</span>
            </button>

            {/* Mobile Bottom Sheet */}
            {mobileFiltersOpen && (
                <div className="mobile-filters-overlay">
                    <div className="mobile-filters-sheet">
                        <div className="sheet-header">
                            <h3 className="heading-sm">Filters</h3>
                            <button onClick={() => setMobileFiltersOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="sheet-content">
                            <FilterGroup title="Size">
                                <CheckboxFilter
                                    options={SIZES}
                                    selected={filters.sizes}
                                    onChange={handleSizeChange}
                                />
                            </FilterGroup>

                            <FilterGroup title="Color">
                                <ColorFilter
                                    colors={COLORS}
                                    selected={filters.colors}
                                    onChange={handleColorChange}
                                />
                            </FilterGroup>

                            <FilterGroup title="Price Range">
                                <PriceRangeFilter
                                    min={Number(filters.minPrice)}
                                    max={Number(filters.maxPrice)}
                                    onChange={handlePriceChange}
                                />
                            </FilterGroup>
                        </div>
                        <div className="sheet-footer">
                            <button onClick={clearFilters} className="btn-clear">Clear All</button>
                            <button onClick={() => setMobileFiltersOpen(false)} className="btn-apply">Show Results</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
