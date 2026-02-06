import { WishlistModel } from '../models/wishlist.model';
import { ProductModel } from '../models/product.model';
import { AppError } from '../../../common/errors/app-error';

export const getWishlist = async (userId: string) => {
    const wishlist = await WishlistModel.findOne({ userId })
        .populate('items.productId')
        .lean();

    if (!wishlist) {
        return [];
    }

    // Filter out null products (deleted ones)
    return wishlist.items
        .filter(item => item.productId)
        .map(item => ({
            ...item,
            product: item.productId
        }));
};

export const addToWishlist = async (userId: string, productId: string) => {
    // Verify product exists
    const product = await ProductModel.findById(productId);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    let wishlist = await WishlistModel.findOne({ userId });

    if (!wishlist) {
        wishlist = await WishlistModel.create({ userId, items: [] });
    }

    // Check if already in wishlist
    const exists = wishlist.items.some(item => item.productId.toString() === productId);
    if (exists) {
        throw new AppError('Product already in wishlist', 400);
    }

    wishlist.items.push({ productId: product._id, addedAt: new Date() });
    await wishlist.save();

    return wishlist;
};

export const removeFromWishlist = async (userId: string, productId: string) => {
    const wishlist = await WishlistModel.findOne({ userId });

    if (!wishlist) {
        throw new AppError('Wishlist not found', 404);
    }

    wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);
    await wishlist.save();

    return wishlist;
};
