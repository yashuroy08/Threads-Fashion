import { Request, Response } from 'express';
import { asyncHandler } from '../../../common/utils/async-handler';
import { getWishlist, addToWishlist, removeFromWishlist } from '../services/wishlist.service';

export const getWishlistHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req.user as any).id;
        const items = await getWishlist(userId);
        res.status(200).json(items);
    }
);

export const addToWishlistHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req.user as any).id;
        const { productId } = req.body;

        await addToWishlist(userId, productId);

        res.status(200).json({ message: 'Added to wishlist' });
    }
);

export const removeFromWishlistHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req.user as any).id;
        const { productId } = req.params;

        await removeFromWishlist(userId, productId);

        res.status(200).json({ message: 'Removed from wishlist' });
    }
);
