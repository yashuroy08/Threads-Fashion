import { Schema, model, Document } from 'mongoose';
import { CallbackWithoutResultAndOptionalError } from 'mongoose';

export interface ProductVariant {
    size: string;
    color: string;
    stock: number;
    reservedStock: number;
    availableStock: number;  // Computed: stock - reservedStock
    sku?: string;
}

export interface ProductDocument extends Document {
    title: string;
    slug: string;
    description: string;
    price: {
        amount: number;      // integer, paise
        currency: 'INR';
    };
    images: {
        url: string;
        altText: string;
        color?: string;
    }[];
    isActive: boolean;
    inStock: boolean;

    // ✅ HIERARCHICAL CATEGORIES
    parentCategoryId: Schema.Types.ObjectId;  // References parent category (e.g., "Men")
    childCategoryId: Schema.Types.ObjectId;   // References child category (e.g., "Men Jeans")

    // ✅ NEW FILTERING FIELDS
    sizes: string[];
    colors: string[];
    isFeatured: boolean;
    discountPercentage?: number;

    // ✅ VARIANT-LEVEL STOCK MANAGEMENT
    variants: ProductVariant[];  // Stock tracked per size+color combination

    // ✅ LEGACY FIELDS (kept for backward compatibility)
    stock: number;         // Total physical inventory (computed from variants)
    reservedStock: number; // Total reserved (computed from variants)

    sellerZipCode: string; // ✅ Location where this product ships from

    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema = new Schema<ProductDocument>(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, index: true },
        description: { type: String, required: true, trim: true, minlength: 20 },

        // ✅ HIERARCHICAL CATEGORIES
        parentCategoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
        childCategoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },

        price: {
            amount: { type: Number, required: true, min: 0, index: true },
            currency: { type: String, enum: ['INR'], required: true },
        },

        images: {
            type: [
                {
                    url: { type: String, required: true, trim: true },
                    altText: { type: String, required: true, trim: true },
                    color: { type: String, required: false, trim: true }, // ✅ Linked to variant color
                },
            ],
            validate: {
                validator: function (images: { url: string; altText: string }[]) {
                    return Array.isArray(images) && images.length > 0;
                },
                message: 'Product must have at least one image',
            },
        },

        // ✅ NEW FILTERING FIELDS
        sizes: { type: [String], index: true, default: [] },
        colors: { type: [String], index: true, default: [] },
        isFeatured: { type: Boolean, default: false, index: true },
        discountPercentage: { type: Number, min: 0, max: 100, default: 0 },

        isActive: { type: Boolean, default: true, index: true },
        inStock: { type: Boolean, default: true },

        // ✅ VARIANT-LEVEL STOCK MANAGEMENT
        variants: {
            type: [
                {
                    size: { type: String, required: true },
                    color: { type: String, required: true },
                    stock: { type: Number, required: true, min: 0, default: 0 },
                    reservedStock: { type: Number, required: true, min: 0, default: 0 },
                    availableStock: { type: Number, required: true, min: 0, default: 0 },  // Computed field
                    sku: { type: String }
                }
            ],
            default: []
        },

        // ✅ LEGACY FIELDS (kept for backward compatibility, computed from variants)
        stock: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
        reservedStock: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        sellerZipCode: { type: String, default: '110001' },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Update total stock from variants before saving
// Update total stock from variants before saving
ProductSchema.pre('save', async function () {
    // ✅ ALWAYS RESYNC sizes and colors from variants (source of truth)
    // This prevents frontend "legacy" fields from overwriting derived data
    if (this.variants && this.variants.length > 0) {
        // Extract unique sizes and colors from variants
        const uniqueSizes = [...new Set(this.variants.map(v => v.size).filter(Boolean))];
        const uniqueColors = [...new Set(this.variants.map(v => v.color).filter(Boolean))];

        // Update the sizes and colors arrays
        this.sizes = uniqueSizes;
        this.colors = uniqueColors;

        // Compute total stock from all variants
        // Always recalculate to ensure accuracy
        this.variants.forEach(variant => {
            variant.availableStock = (variant.stock || 0) - (variant.reservedStock || 0);
        });

        this.stock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
        this.reservedStock = this.variants.reduce((sum, v) => sum + (v.reservedStock || 0), 0);

        // Update inStock status
        this.inStock = this.stock > 0;
    } else {
        // Fallback for simple products (if any exist)
        this.inStock = (this.stock || 0) > 0;
    }
});

// ✅ Virtual: Total available stock across all variants
ProductSchema.virtual('availableStock').get(function () {
    return (this.stock || 0) - (this.reservedStock || 0);
});

// ✅ Virtual: Get only in-stock variants
ProductSchema.virtual('availableVariants').get(function () {
    return this.variants.filter(v => (v.stock - v.reservedStock) > 0);
});

// ✅ Virtual: Total stock across all variants
ProductSchema.virtual('totalStock').get(function () {
    return this.variants.reduce((sum, v) => sum + v.stock, 0);
});

export const ProductModel = model<ProductDocument>('Product', ProductSchema);