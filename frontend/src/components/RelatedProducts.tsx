import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import type { Product } from './ProductCard';
import { API_BASE } from '../config/api.config';

function normalizeForCard(p: Record<string, unknown>): Product | null {
    const id = String(p.id ?? p._id ?? '');
    const slug = p.slug as string | undefined;
    if (!id || !slug) return null;

    const priceRaw = p.price as { amount?: number; currency?: string } | undefined;
    const amount = priceRaw?.amount ?? (p.priceAmount as number | undefined) ?? 0;

    const images = Array.isArray(p.images) ? (p.images as Product['images']) : [];

    return {
        id,
        _id: id,
        slug,
        title: String(p.title ?? ''),
        price: {
            amount,
            currency: priceRaw?.currency ?? (p.currency as string) ?? 'INR',
        },
        images,
        colors: p.colors as string[] | undefined,
        sizes: p.sizes as string[] | undefined,
        isFeatured: p.isFeatured as boolean | undefined,
        discountPercentage: p.discountPercentage as number | undefined,
        inStock: p.inStock !== false,
        isNew: p.isNew as boolean | undefined,
    };
}

export default function RelatedProducts({
    currentProductId,
    parentCategoryId,
    childCategoryId,
    parentCategorySlug,
    childCategorySlug,
}: {
    currentProductId: string;
    parentCategoryId?: string;
    childCategoryId?: string;
    parentCategorySlug?: string;
    childCategorySlug?: string;
}) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentProductId) {
            setLoading(false);
            setProducts([]);
            return;
        }

        setLoading(true);
        fetch(`${API_BASE}/products?limit=100&sortBy=newest`)
            .then((res) => res.json())
            .then((data: unknown) => {
                const raw = data as { content?: unknown[]; items?: unknown[] };
                const items = raw.content || raw.items || (Array.isArray(data) ? data : []);
                if (!Array.isArray(items)) {
                    console.error('Related products API returned unexpected format', data);
                    setProducts([]);
                    setLoading(false);
                    return;
                }

                const current = String(currentProductId);
                let pool = items.filter((row) => {
                    const p = row as Record<string, unknown>;
                    const pid = String(p.id ?? p._id ?? '');
                    return pid && pid !== current;
                }) as Record<string, unknown>[];

                if (childCategoryId) {
                    const byChild = pool.filter(
                        (p) => String(p.childCategoryId ?? '') === String(childCategoryId)
                    );
                    if (byChild.length > 0) pool = byChild;
                    else if (parentCategoryId) {
                        const byParent = pool.filter(
                            (p) => String(p.parentCategoryId ?? '') === String(parentCategoryId)
                        );
                        if (byParent.length > 0) pool = byParent;
                    }
                } else if (parentCategoryId) {
                    const byParent = pool.filter(
                        (p) => String(p.parentCategoryId ?? '') === String(parentCategoryId)
                    );
                    if (byParent.length > 0) pool = byParent;
                } else if (parentCategorySlug || childCategorySlug) {
                    const bySlug = pool.filter((p) => {
                        const parent = p.parentCategory as { slug?: string } | undefined;
                        const child = p.childCategory as { slug?: string } | undefined;
                        return (
                            (parentCategorySlug && parent?.slug === parentCategorySlug) ||
                            (childCategorySlug && child?.slug === childCategorySlug)
                        );
                    });
                    if (bySlug.length > 0) pool = bySlug;
                }

                const normalized: Product[] = [];
                for (const row of pool) {
                    const card = normalizeForCard(row);
                    if (card) normalized.push(card);
                }

                const shuffled = [...normalized].sort(() => 0.5 - Math.random());
                setProducts(shuffled.slice(0, 4));
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch related products', err);
                setProducts([]);
                setLoading(false);
            });
    }, [currentProductId, parentCategoryId, childCategoryId, parentCategorySlug, childCategorySlug]);

    if (!loading && products.length === 0) return null;

    return (
        <section className="related-products" aria-busy={loading}>
            <div className="section-header">
                <h2>You May Also Like</h2>
                <Link to="/products" className="view-all-link">
                    View All
                </Link>
            </div>
            {loading ? (
                <div className="related-products-loading">Loading recommendations…</div>
            ) : (
                <div className="related-grid">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="related-card-wrapper"
                            onClick={() => window.scrollTo(0, 0)}
                        >
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
