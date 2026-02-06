import { CartModel } from '../models/cart.model';
import { ProductModel } from '../models/product.model';
import { AppError } from '../../../common/errors/app-error';

// Helper to ensure cart exists
const getOrCreateCart = async (userId: string) => {
    let cart = await CartModel.findOne({ userId });
    if (!cart) {
        cart = await CartModel.create({ userId, items: [], savedForLater: [] });
    }
    return cart;
};

export const getCart = async (userId: string) => {
    const cart = await getOrCreateCart(userId);

    // Populate product details
    await cart.populate([
        { path: 'items.productId', select: 'title slug price images inStock stock reservedStock isActive sizes colors variants' },
        { path: 'savedForLater.productId', select: 'title slug price images inStock stock reservedStock isActive sizes colors variants' }
    ]);

    const cartObj = cart.toObject();

    let totalAmount = 0;
    let totalItems = 0;
    let hasIssues = false; // Flag to disable checkout button on frontend if needed

    // Filter out items where product was deleted (productId is null after populate)
    // then process remaining items to add flags and calculate totals
    const itemsWithStatus = cartObj.items
        .filter((item: any) => item.productId !== null) // Remove deleted products
        .map((item: any) => {
            const product = item.productId;

            let status = 'AVAILABLE';
            let issue = null;

            // Check availability - with defensive null checks
            const stock = product?.stock ?? 0;
            const reservedStock = product?.reservedStock ?? 0;
            const availableStock = stock - reservedStock;

            if (!product || !product.isActive) {
                status = 'UNAVAILABLE';
                issue = 'Product is no longer available';
                hasIssues = true;
            } else if (!product.inStock || availableStock < item.quantity) {
                status = 'OUT_OF_STOCK';
                issue = `Only ${Math.max(0, availableStock)} left in stock`;
                hasIssues = true;
            }

            // Calculate line total (using current price) - with null check
            const priceAmount = product?.price?.amount ?? 0;
            const lineTotal = priceAmount * item.quantity;

            if (status === 'AVAILABLE') {
                totalAmount += lineTotal;
                totalItems += item.quantity;
            }

            console.log('🔍 DEBUG: Returning cart item with fields:', {
                productId: item.productId?._id || item.productId,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                hasSize: 'size' in item,
                hasColor: 'color' in item
            });

            return {
                ...item,
                lineTotal,
                status,
                issue
            };
        });

    return {
        _id: cartObj._id,
        items: itemsWithStatus,
        savedForLater: cartObj.savedForLater,
        billDetails: {
            totalAmount,      // Grand total in paise
            totalItems,       // Total count of items
            currency: 'INR',
            deliveryFee: totalAmount > 50000 ? 0 : 5000, // Example: Free shipping over ₹500
        },
        hasIssues // Frontend can use this to disable "Checkout" button
    };
};

export const addToCart = async (
    userId: string,
    productId: string,
    quantity: number = 1,
    size?: string,
    color?: string
) => {
    // 🔍 DEBUG: Log what we receive
    console.log('🔍 DEBUG: addToCart service called with:', {
        userId,
        productId,
        quantity,
        size,
        color,
        hasSizeParam: size !== undefined,
        hasColorParam: color !== undefined
    });

    const cart = await getOrCreateCart(userId);
    const product = await ProductModel.findById(productId);

    if (!product) throw new AppError('Product not found', 404);

    // Validate product data integrity
    if (!product.price || typeof product.price.amount !== 'number') {
        console.error(`Product ${productId} has invalid price data:`, product.price);
        throw new AppError('Product price data is invalid', 500);
    }

    // Check variant-specific stock if size and color are provided
    let availableStock = 0;
    if (size && color && product.variants && product.variants.length > 0) {
        const variant = product.variants.find(v => v.size === size && v.color === color);
        if (!variant) {
            throw new AppError(`Variant ${size}/${color} not found`, 404);
        }
        availableStock = (variant.stock || 0) - (variant.reservedStock || 0);

        if (availableStock <= 0) {
            throw new AppError(`Size ${size} in ${color} is out of stock`, 400);
        }
    } else {
        // Fallback to total stock
        availableStock = (product.stock || 0) - (product.reservedStock || 0);
    }

    if (!product.inStock || availableStock <= 0) throw new AppError('Product is out of stock', 400);
    if (!product.isActive) throw new AppError('Product is unavailable', 400);

    // Find existing item with same product AND same variant
    const existingItemIndex = cart.items.findIndex(
        (item) =>
            item.productId.toString() === productId &&
            item.size === size &&
            item.color === color
    );

    const currentQty = existingItemIndex > -1 ? cart.items[existingItemIndex].quantity : 0;

    if (currentQty + quantity > availableStock) {
        throw new AppError(`Only ${availableStock} items left in stock for this variant`, 400);
    }

    if (existingItemIndex > -1) {
        // Update existing quantity for same variant
        cart.items[existingItemIndex].quantity += quantity;
        cart.items[existingItemIndex].priceSnapshot = product.price.amount;
    } else {
        // Add new item with variant info
        const newItem = {
            productId: product._id.toString(),
            quantity,
            priceSnapshot: product.price.amount,
            size,
            color,
            addedAt: new Date(),
        };

        console.log('🔍 DEBUG: Pushing new cart item:', newItem);
        cart.items.push(newItem as any);
    }

    // If item was in "Saved for Later", remove it from there
    cart.savedForLater = cart.savedForLater.filter(
        (item) => item.productId.toString() !== productId
    );

    console.log('🔍 DEBUG: About to save cart. Items:', cart.items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        size: i.size,
        color: i.color
    })));

    await cart.save();
    return getCart(userId);
};

export const updateItemQuantity = async (
    userId: string,
    productId: string,
    quantity: number,
    size?: string,
    color?: string
) => {
    const cart = await getOrCreateCart(userId);

    // Find item by productId AND variant (if provided)
    const itemIndex = cart.items.findIndex((item) => {
        const matchesProduct = item.productId.toString() === productId;
        const matchesSize = size ? item.size === size : true;
        const matchesColor = color ? item.color === color : true;
        return matchesProduct && matchesSize && matchesColor;
    });

    if (itemIndex === -1) throw new AppError('Item not found in cart', 404);

    if (quantity <= 0) {
        // If quantity is 0 or less, remove the item
        cart.items.splice(itemIndex, 1);
    } else {
        // Check stock before updating quantity
        if (quantity > cart.items[itemIndex].quantity) {
            const cartItem = cart.items[itemIndex];
            const product = await ProductModel.findById(productId);

            if (!product?.inStock) {
                throw new AppError('Product is out of stock', 400);
            }

            // 🔥 CRITICAL: Check variant-specific stock if item has size/color
            if (cartItem.size && cartItem.color && product.variants && product.variants.length > 0) {
                const variant = product.variants.find(
                    v => v.size === cartItem.size && v.color === cartItem.color
                );

                if (!variant) {
                    throw new AppError(`Variant ${cartItem.size}/${cartItem.color} not found`, 404);
                }

                const variantAvailable = (variant.stock || 0) - (variant.reservedStock || 0);

                if (quantity > variantAvailable) {
                    throw new AppError(
                        `Only ${variantAvailable} items available for ${cartItem.size}/${cartItem.color}`,
                        400
                    );
                }
            } else {
                // Fallback to total stock check
                const totalAvailable = (product.stock || 0) - (product.reservedStock || 0);
                if (quantity > totalAvailable) {
                    throw new AppError(`Only ${totalAvailable} items available`, 400);
                }
            }
        }
        cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    return getCart(userId);
};

export const removeItem = async (
    userId: string,
    productId: string,
    size?: string,
    color?: string
) => {
    const cart = await getOrCreateCart(userId);

    // Remove item matching productId AND variant (if provided)
    cart.items = cart.items.filter((item) => {
        const matchesProduct = item.productId.toString() === productId;
        const matchesSize = size ? item.size === size : true;
        const matchesColor = color ? item.color === color : true;
        const shouldRemove = matchesProduct && matchesSize && matchesColor;
        return !shouldRemove; // Keep items that don't match
    });

    await cart.save();
    return getCart(userId);
};

export const saveForLater = async (userId: string, productId: string) => {
    const cart = await getOrCreateCart(userId);

    // Find the item in the cart
    const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) throw new AppError('Item not found in cart', 404);

    // Remove from items
    cart.items.splice(itemIndex, 1);

    // Add to savedForLater if not already there
    const alreadySaved = cart.savedForLater.some(
        (item) => item.productId.toString() === productId
    );

    if (!alreadySaved) {
        cart.savedForLater.push({
            productId,
            addedAt: new Date(),
        });
    }

    await cart.save();
    return getCart(userId);
};

export const moveToCart = async (userId: string, productId: string) => {
    // Re-use logic: "Adding to cart" automatically removes from "Saved for Later" 
    // inside the addToCart function.
    return addToCart(userId, productId, 1);
};

export const clearCart = async (userId: string) => {
    const cart = await CartModel.findOne({ userId });
    if (cart) {
        cart.items = [];
        await cart.save();
    }
}