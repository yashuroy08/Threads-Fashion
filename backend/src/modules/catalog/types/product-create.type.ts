export type CreateProductInput = {
    title: string;
    slug: string;

    description: string;

    price: {
        amount: number;      // paise
        currency: 'INR';
    };

    parentCategoryId: string;
    childCategoryId: string;

    images: {
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

    stock: number;
    inStock: boolean;
    isActive?: boolean;
};
