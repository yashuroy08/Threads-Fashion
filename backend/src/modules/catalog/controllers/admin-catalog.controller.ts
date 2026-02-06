import { Request, Response } from 'express';
import { asyncHandler } from '../../../common/utils/async-handler';
import { updateProduct, reactivateProduct, deactivateProduct, createProduct, listAllProducts } from '../services/catalog.service';

export const getAdminProductList = asyncHandler(
    async (req: Request, res: Response) => {
        const products = await listAllProducts();
        res.status(200).json({
            items: products
        });
    }
);

export const createProductHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const productId = await createProduct(
            req.body,
            req.user as { id: string; role: 'admin' }
        );

        res.status(201).json({
            id: productId,
            message: 'Product created successfully',
        });
    }
);

export const updateProductHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const updatedId = await updateProduct(
            id,
            req.body,
            req.user as { id: string; role: 'admin' }
        );

        res.json({
            id: updatedId,
            message: 'Product updated successfully',
        });
    }
);

export const deactivateProductHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        await deactivateProduct(id, req.user as { id: string; role: 'admin' });

        res.json({ message: 'Product deactivated' });
    }
);

export const reactivateProductHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        await reactivateProduct(id, req.user as { id: string; role: 'admin' });

        res.json({ message: 'Product reactivated' });
    }
);