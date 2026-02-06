export type ProductImage = {
    url: string;
    altText: string;
    color?: string;
};

export type ProductVariant = {
    size: string;
    color: string;
    stock: number;
    reservedStock: number;
    availableStock: number;  // Computed: stock - reservedStock
    sku?: string;
};

export type ProductDetailRead = {
    id: string;
    title: string;
    slug: string;

    description: string;

    price: {
        amount: number;      // paise
        currency: 'INR';
    };

    images: ProductImage[];

    // ✅ NEW FIELDS
    sizes: string[];
    colors: string[];
    isFeatured: boolean;
    discountPercentage?: number;

    // ✅ VARIANT-LEVEL STOCK
    variants: ProductVariant[];
    totalStock?: number;  // Sum of all variant stocks
    availableVariants?: ProductVariant[];  // Only in-stock variants

    // Legacy fields (computed from variants)
    inStock: boolean;
    stock?: number;
    reservedStock?: number;
    isActive?: boolean;
    parentCategory?: { name: string; slug: string };
    childCategory?: { name: string; slug: string };
    category?: string; // Kept for backward compatibility
    sellerZipCode?: string;

    createdAt: Date;
    updatedAt: Date;
};
