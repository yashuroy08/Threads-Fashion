export type UpdateProductInput = {
    title?: string;
    description?: string;

    price?: {
        amount: number;
        currency: 'INR';
    };

    parentCategoryId?: string;
    childCategoryId?: string;

    thumbnailUrl?: string;

    images?: {
        url: string;
        altText: string;
        color?: string;
    }[];

    sizes?: string[];
    colors?: string[];

    // Variant-level stock
    variants?: {
        size: string;
        color: string;
        stock: number;
        reservedStock?: number;
        sku?: string;
    }[];

    stock?: number;
    inStock?: boolean;
    isActive?: boolean; // for reactivation only
};
