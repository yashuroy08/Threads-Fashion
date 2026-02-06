import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import type { Product } from './ProductCard';



export default function RelatedProducts({ currentProductId, category }: { currentProductId: string, category?: string }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch all products and filter (simulating a recommendation engine)
        fetch('/api/v1/products')
            .then(res => res.json())
            .then((data: any) => {
                if (!data || !Array.isArray(data.items)) {
                    console.error("Related products API returned unexpected format", data);
                    setProducts([]);
                    setLoading(false);
                    return;
                }
                // Filter out current product
                let related = data.items.filter((p: any) => p._id !== currentProductId && p.id !== currentProductId);

                // If category is provided, prioritize same category
                if (category) {
                    const sameCategory = related.filter((p: any) =>
                        p.parentCategory?.slug === category ||
                        p.childCategory?.slug === category ||
                        p.category === category // Fallback
                    );
                    if (sameCategory.length > 0) {
                        related = sameCategory;
                    }
                }

                // Randomly select 4
                const shuffled = related.sort(() => 0.5 - Math.random());
                setProducts(shuffled.slice(0, 4));
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch related products", err);
                setLoading(false);
            });
    }, [currentProductId, category]);

    if (loading || products.length === 0) return null;

    return (
        <section className="related-products">
            <div className="section-header">
                <h2>You May Also Like</h2>
                <Link to="/products" className="view-all-link">View All</Link>
            </div>
            <div className="related-grid">
                {products.map(product => (
                    <div key={product.id} className="related-card-wrapper" onClick={() => window.scrollTo(0, 0)}>
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </section>
    );
}
