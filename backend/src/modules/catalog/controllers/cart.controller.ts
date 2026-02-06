import { Request, Response } from 'express';
import { asyncHandler } from '../../../common/utils/async-handler';
import * as CartService from '../services/cart.service';

export const getMyCart = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const cart = await CartService.getCart(userId);
        res.status(200).json(cart);
    }
);

export const addItemToCart = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { productId, quantity, size, color } = req.body;

        const cart = await CartService.addToCart(userId, productId, quantity, size, color);
        res.status(200).json(cart);
    }
);

export const updateCartItem = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { productId } = req.params;
        const { quantity, size, color } = req.body;

        const cart = await CartService.updateItemQuantity(userId, productId, quantity, size, color);
        res.status(200).json(cart);
    }
);

export const removeCartItem = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { productId } = req.params;
        const { size, color } = req.query;

        const cart = await CartService.removeItem(
            userId,
            productId,
            size as string | undefined,
            color as string | undefined
        );
        res.status(200).json(cart);
    }
);

export const saveItemForLater = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { productId } = req.params;

        const cart = await CartService.saveForLater(userId, productId);
        res.status(200).json(cart);
    }
);

export const moveSavedToCart = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { productId } = req.params;

        // Moves 1 unit back to cart
        const cart = await CartService.moveToCart(userId, productId);
        res.status(200).json(cart);
    }
);

export const clearCart = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        await CartService.clearCart(userId);
        res.status(200).json({ message: 'Cart cleared' });
    }
);