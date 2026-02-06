import { Types } from 'mongoose';
import { ProductModel } from '../models/product.model';
import { CategoryModel } from '../models/category.model';
import { ProductDetailRead } from '../types/product-read.type';
import { AppError } from '../../../common/errors/app-error';
import { CreateProductInput } from '../types/product-create.type';
import { UpdateProductInput } from '../types/product-update.type';
import { logAuditEvent } from './audit.service';
import { emitProductStatus } from '../../../common/utils/socket';

export const findProductDetailBySlug = async (
    rawSlug: string
): Promise<ProductDetailRead> => {
    const term = rawSlug.trim();

    if (!term) {
        throw new AppError('Invalid product identifier', 400);
    }

    const query: any = { isActive: true };

    // Check if it's a valid ObjectId (direct ID lookup)
    // Otherwise treat as slug
    if (Types.ObjectId.isValid(term)) {
        query._id = term;
    } else {
        query.slug = term.toLowerCase();
    }

    const product = await ProductModel.findOne(
        query,
        {
            title: 1,
            slug: 1,
            description: 1,
            price: 1,
            images: 1,
            sizes: 1,
            colors: 1,
            variants: 1,  // Include variant-level stock
            inStock: 1,
            stock: 1,
            reservedStock: 1,
            sellerZipCode: 1,
            parentCategoryId: 1,
            childCategoryId: 1,
            createdAt: 1,
            updatedAt: 1,
        }
    ).populate('parentCategoryId childCategoryId').lean();

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    return {
        id: product._id.toString(),
        title: product.title,
        slug: product.slug,
        description: product.description,
        price: {
            amount: product.price.amount,
            currency: product.price.currency,
        },
        images: product.images,
        sizes: product.sizes || [],
        colors: product.colors || [],
        isFeatured: product.isFeatured || false,
        discountPercentage: product.discountPercentage,

        // Variant-level stock with computed availableStock
        variants: (product.variants || []).map(v => ({
            size: v.size,
            color: v.color,
            stock: v.stock,
            reservedStock: v.reservedStock,
            availableStock: (v.stock || 0) - (v.reservedStock || 0),
            sku: v.sku
        })),

        // Category Mapping for Breadcrumbs
        parentCategory: (product as any).parentCategoryId ? {
            name: (product as any).parentCategoryId.name,
            slug: (product as any).parentCategoryId.slug
        } : undefined,
        childCategory: (product as any).childCategoryId ? {
            name: (product as any).childCategoryId.name,
            slug: (product as any).childCategoryId.slug
        } : undefined,

        // Legacy fields
        inStock: product.inStock,
        stock: product.stock,
        reservedStock: product.reservedStock,
        category: (product as any).childCategoryId?.name || (product as any).parentCategoryId?.name || 'General',
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
};

export const listProducts = async (
    page: number,
    limit: number,
    filters: {
        parentCategory?: string;
        childCategory?: string;
        minPrice?: number;
        maxPrice?: number;
        sizes?: string[];
        colors?: string[];
        search?: string;
    } = {},
    sortBy: 'price_asc' | 'price_desc' | 'newest' | 'featured' = 'newest'
): Promise<ProductDetailRead[]> => {
    const safeLimit = Math.min(limit, 50); // Increased limit slightly
    const skip = (page - 1) * safeLimit;

    const query: any = { isActive: true };

    // 1. HIERARCHY FILTERS
    if (filters.childCategory) {
        if (Types.ObjectId.isValid(filters.childCategory)) {
            query.childCategoryId = filters.childCategory;
        } else {
            const cat = await CategoryModel.findOne({ slug: filters.childCategory.toLowerCase() });
            if (cat) {
                query.childCategoryId = cat._id;
            } else {
                return []; // Category not found
            }
        }
    } else if (filters.parentCategory) {
        if (Types.ObjectId.isValid(filters.parentCategory)) {
            query.parentCategoryId = filters.parentCategory;
        } else {
            const cat = await CategoryModel.findOne({ slug: filters.parentCategory.toLowerCase() });
            if (cat) {
                query.parentCategoryId = cat._id;
            } else {
                return []; // Category not found
            }
        }
    }

    // 2. RANGE FILTERS (Price)
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        query['price.amount'] = {};
        if (filters.minPrice !== undefined) query['price.amount'].$gte = filters.minPrice;
        if (filters.maxPrice !== undefined) query['price.amount'].$lte = filters.maxPrice;
    }

    // 3. ARRAY FILTERS (Size & Color) - Match ANY selected (OR logic within field)
    if (filters.sizes && filters.sizes.length > 0) {
        query.sizes = { $in: filters.sizes };
    }
    if (filters.colors && filters.colors.length > 0) {
        // Case-insensitive match for colors often helps, but strict for now based on performance
        query.colors = { $in: filters.colors };
    }

    // 4. SEARCH (Basic regex if provided)
    if (filters.search) {
        const regex = new RegExp(filters.search.trim(), 'i');
        query.$or = [{ title: regex }, { description: regex }];
    }

    // 5. SORTING
    let sort: any = { createdAt: -1 }; // Default newest
    switch (sortBy) {
        case 'price_asc':
            sort = { 'price.amount': 1 };
            break;
        case 'price_desc':
            sort = { 'price.amount': -1 };
            break;
        case 'featured':
            sort = { isFeatured: -1, createdAt: -1 };
            break;
        case 'newest':
        default:
            sort = { createdAt: -1 };
    }

    const products = await ProductModel.find(query)
        .populate('parentCategoryId childCategoryId')
        .sort(sort)
        .skip(skip)
        .limit(safeLimit)
        .lean();

    return products.map((product) => ({
        id: product._id.toString(),
        title: product.title,
        slug: product.slug,
        description: product.description,
        price: {
            amount: product.price.amount,
            currency: product.price.currency,
        },
        images: product.images.map((image) => ({
            url: image.url,
            altText: image.altText,
            color: image.color,
        })),
        sizes: product.sizes || [],
        colors: product.colors || [],
        isFeatured: product.isFeatured || false,
        discountPercentage: product.discountPercentage,
        isActive: product.isActive,
        inStock: product.inStock,
        stock: product.stock,
        reservedStock: product.reservedStock,
        variants: (product.variants || []).map(v => ({
            size: v.size,
            color: v.color,
            stock: v.stock,
            reservedStock: v.reservedStock,
            availableStock: (v.stock || 0) - (v.reservedStock || 0),
            sku: v.sku
        })),
        parentCategory: (product as any).parentCategoryId ? {
            name: (product as any).parentCategoryId.name,
            slug: (product as any).parentCategoryId.slug
        } : undefined,
        childCategory: (product as any).childCategoryId ? {
            name: (product as any).childCategoryId.name,
            slug: (product as any).childCategoryId.slug
        } : undefined,
        category: (product as any).childCategoryId?.name || (product as any).parentCategoryId?.name || 'General',
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    }));
};

export const listAllProducts = async (): Promise<ProductDetailRead[]> => {
    const products = await ProductModel.find()
        .populate('parentCategoryId childCategoryId')
        .sort({ createdAt: -1 })
        .lean();

    return products.map((product) => ({
        id: product._id.toString(),
        title: product.title,
        slug: product.slug,
        description: product.description,
        price: {
            amount: product.price.amount,
            currency: product.price.currency,
        },
        images: product.images.map((image) => ({
            url: image.url,
            altText: image.altText,
            color: image.color,
        })),
        sizes: product.sizes || [],
        colors: product.colors || [],
        isFeatured: product.isFeatured || false,
        discountPercentage: product.discountPercentage,
        isActive: product.isActive,
        inStock: product.inStock,
        stock: product.stock,
        reservedStock: product.reservedStock,
        variants: (product.variants || []).map(v => ({
            size: v.size,
            color: v.color,
            stock: v.stock,
            reservedStock: v.reservedStock,
            availableStock: (v.stock || 0) - (v.reservedStock || 0),
            sku: v.sku
        })),
        parentCategory: (product as any).parentCategoryId ? {
            name: (product as any).parentCategoryId.name,
            slug: (product as any).parentCategoryId.slug
        } : undefined,
        childCategory: (product as any).childCategoryId ? {
            name: (product as any).childCategoryId.name,
            slug: (product as any).childCategoryId.slug
        } : undefined,
        category: (product as any).childCategoryId?.name || (product as any).parentCategoryId?.name || 'General',
        sellerZipCode: product.sellerZipCode,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    }));
};

export const createProduct = async (
    input: CreateProductInput,
    actor: { id: string; role: 'admin' }
) => {
    // Business rules (NOT schema rules)

    if (input.price.amount <= 0) {
        throw new AppError('Price must be greater than zero', 400);
    }

    if (!input.images || input.images.length === 0) {
        throw new AppError('At least one product image is required', 400);
    }

    const wordCount = input.description.trim().split(/\s+/).length;
    if (wordCount < 20) {
        throw new AppError('Description must be at least 20 words', 400);
    }

    // ✅ VALIDATE VARIANTS (if provided)
    if (input.variants && input.variants.length > 0) {
        const seenCombos = new Set<string>();
        const variantColors = new Set<string>();
        const variantSizes = new Set<string>();

        input.variants.forEach((variant, idx) => {
            // Check for required fields
            if (!variant.size || !variant.color) {
                throw new AppError(
                    `Variant ${idx + 1}: Both size and color are required`,
                    400
                );
            }

            // Check for duplicates
            const combo = `${variant.size.trim().toLowerCase()}-${variant.color.trim().toLowerCase()}`;
            if (seenCombos.has(combo)) {
                throw new AppError(
                    `Duplicate variant: ${variant.size} / ${variant.color}`,
                    400
                );
            }
            seenCombos.add(combo);

            // Collect unique colors and sizes
            variantColors.add(variant.color.trim().toLowerCase());
            variantSizes.add(variant.size.trim().toLowerCase());

            // Validate stock
            if (variant.stock < 0) {
                throw new AppError(
                    `Variant ${idx + 1}: Stock cannot be negative`,
                    400
                );
            }
        });

        // ✅ VALIDATE IMAGES (colors must match variant colors)
        if (input.images && input.images.length > 0) {
            input.images.forEach((image, idx: number) => {
                if (image.color) {
                    const imgColor = image.color.trim().toLowerCase();
                    if (!variantColors.has(imgColor)) {
                        throw new AppError(
                            `Image ${idx + 1}: Color "${image.color}" doesn't match any variant. Available: ${Array.from(variantColors).join(', ')}`,
                            400
                        );
                    }
                }
            });
        }
    }

    const existing = await ProductModel.findOne({
        slug: input.slug,
    });

    if (existing) {
        throw new AppError('Product with this slug already exists', 409);
    }

    try {
        const product = await ProductModel.create({
            ...input,
            parentCategoryId: input.parentCategoryId as any,
            childCategoryId: input.childCategoryId as any,
            stock: input.stock || 0,
            reservedStock: 0,
            inStock: (input.stock || 0) > 0,
            isActive: input.isActive ?? true
        } as any);

        await logAuditEvent({
            actorId: actor.id,
            actorRole: actor.role,
            action: 'CREATE_PRODUCT',
            entity: 'Product',
            entityId: product._id.toString(),
            metadata: { title: product.title },
        });

        return product._id.toString();
    } catch (error: any) {
        // Convert Mongoose validation errors → clean API errors
        if (error.name === 'ValidationError') {
            throw new AppError(error.message, 400);
        }

        throw error;
    }
};

export const updateProduct = async (
    productId: string,
    updates: UpdateProductInput,
    actor: { id: string; role: 'admin' }
) => {
    const product = await ProductModel.findById(productId);

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // ❌ Slug is immutable
    if ((updates as any).slug) {
        throw new AppError('Product slug cannot be changed', 400);
    }

    // ❌ Price update not allowed if inactive
    if (!product.isActive && updates.price) {
        throw new AppError(
            'Cannot update price of an inactive product. Reactivate it first.',
            400
        );
    }

    if (updates.description) {
        const wordCount = updates.description.trim().split(/\s+/).length;
        if (wordCount < 20) {
            throw new AppError('Description must be at least 20 words', 400);
        }
    }

    // ✅ VALIDATE VARIANTS (if provided in update)
    if (updates.variants && updates.variants.length > 0) {
        const seenCombos = new Set<string>();
        const variantColors = new Set<string>();
        const variantSizes = new Set<string>();

        updates.variants.forEach((variant, idx) => {
            // Check for required fields
            if (!variant.size || !variant.color) {
                throw new AppError(
                    `Variant ${idx + 1}: Both size and color are required`,
                    400
                );
            }

            // Check for duplicates
            const combo = `${variant.size.trim().toLowerCase()}-${variant.color.trim().toLowerCase()}`;
            if (seenCombos.has(combo)) {
                throw new AppError(
                    `Duplicate variant: ${variant.size} / ${variant.color}`,
                    400
                );
            }
            seenCombos.add(combo);

            // Collect unique colors and sizes
            variantColors.add(variant.color.trim().toLowerCase());
            variantSizes.add(variant.size.trim().toLowerCase());

            // Validate stock
            if (variant.stock < 0) {
                throw new AppError(
                    `Variant ${idx + 1}: Stock cannot be negative`,
                    400
                );
            }
        });

        // ✅ VALIDATE IMAGES (if images are also being updated)
        const imagesToValidate = updates.images || product.images;
        if (imagesToValidate && imagesToValidate.length > 0) {
            imagesToValidate.forEach((image: any, idx: number) => {
                if (image.color) {
                    const imgColor = image.color.trim().toLowerCase();
                    if (!variantColors.has(imgColor)) {
                        throw new AppError(
                            `Image ${idx + 1}: Color "${image.color}" doesn't match any variant. Available: ${Array.from(variantColors).join(', ')}`,
                            400
                        );
                    }
                }
            });
        }
    }

    // Apply allowed updates
    Object.assign(product, updates);

    try {
        await product.save();

        await logAuditEvent({
            actorId: actor.id,
            actorRole: actor.role,
            action: 'UPDATE_PRODUCT',
            entity: 'Product',
            entityId: product._id.toString(),
            metadata: { updates: Object.keys(updates) },
        });

        return product._id.toString();
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            throw new AppError(error.message, 400);
        }
        throw error;
    }
};

export const deactivateProduct = async (
    productId: string,
    actor: { id: string; role: 'admin' }
) => {
    const product = await ProductModel.findById(productId);

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    product.isActive = false;
    await product.save();

    emitProductStatus(productId, false);

    await logAuditEvent({
        actorId: actor.id,
        actorRole: actor.role,
        action: 'DEACTIVATE_PRODUCT',
        entity: 'Product',
        entityId: product._id.toString(),
    });

    return product._id.toString();
};

export const searchProducts = async (
    query: string,
    limit: number = 10
): Promise<ProductDetailRead[]> => {
    const safeLimit = Math.min(limit, 20);

    // Use MongoDB regex search for flexible matching
    const searchRegex = new RegExp(query.trim(), 'i');

    const products = await ProductModel.find({
        isActive: true,
        $or: [
            { title: searchRegex },
            { description: searchRegex }
        ]
    })
        .populate('parentCategoryId childCategoryId')
        .sort({ createdAt: -1 })
        .limit(safeLimit)
        .lean();

    return products.map((product) => ({
        id: product._id.toString(),
        title: product.title,
        slug: product.slug,
        description: product.description,
        price: {
            amount: product.price.amount,
            currency: product.price.currency,
        },
        images: product.images.map((image) => ({
            url: image.url,
            altText: image.altText,
            color: image.color,
        })),
        sizes: product.sizes || [],
        colors: product.colors || [],
        isFeatured: product.isFeatured || false,
        discountPercentage: product.discountPercentage,
        isActive: product.isActive,
        inStock: product.inStock,
        stock: product.stock,
        reservedStock: product.reservedStock,
        variants: (product.variants || []).map(v => ({
            size: v.size,
            color: v.color,
            stock: v.stock,
            reservedStock: v.reservedStock,
            availableStock: (v.stock || 0) - (v.reservedStock || 0),
            sku: v.sku
        })),
        parentCategory: (product as any).parentCategoryId ? {
            name: (product as any).parentCategoryId.name,
            slug: (product as any).parentCategoryId.slug
        } : undefined,
        childCategory: (product as any).childCategoryId ? {
            name: (product as any).childCategoryId.name,
            slug: (product as any).childCategoryId.slug
        } : undefined,
        category: (product as any).childCategoryId?.name || (product as any).parentCategoryId?.name || 'General',
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    }));
};

export const getFilterStats = async () => {
    const stats = await ProductModel.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: null,
                minPrice: { $min: "$price.amount" },
                maxPrice: { $max: "$price.amount" }
            }
        }
    ]);

    if (stats.length === 0) {
        return { minPrice: 0, maxPrice: 10000 };
    }

    return {
        minPrice: stats[0].minPrice,
        maxPrice: stats[0].maxPrice
    };
};

export const reactivateProduct = async (
    productId: string,
    actor: { id: string; role: 'admin' }
) => {
    const product = await ProductModel.findById(productId);

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    product.isActive = true;
    await product.save();

    emitProductStatus(productId, true);

    await logAuditEvent({
        actorId: actor.id,
        actorRole: actor.role,
        action: 'REACTIVATE_PRODUCT',
        entity: 'Product',
        entityId: product._id.toString(),
    });

    return product._id.toString();
};