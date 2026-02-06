import { Request, Response } from 'express';
import { asyncHandler } from '../../../common/utils/async-handler';
import {
    listProducts,
    findProductDetailBySlug,
    searchProducts,
    getFilterStats,
} from '../services/catalog.service';
import { NotFoundError } from '../../../common/errors/http-errors';

export const getProductList = asyncHandler(
    async (req: Request, res: Response) => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;

        // Parse filters
        const filters = {
            parentCategory: req.query.parentCategory as string | undefined,
            childCategory: req.query.childCategory as string | undefined,
            minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
            maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
            sizes: req.query.sizes ? (req.query.sizes as string).split(',') : undefined,
            colors: req.query.colors ? (req.query.colors as string).split(',') : undefined,
            search: req.query.q as string | undefined
        };

        const sortBy = req.query.sort as 'price_asc' | 'price_desc' | 'newest' | 'featured' || 'newest';

        const products = await listProducts(page, limit, filters, sortBy);

        res.status(200).json({
            items: products,
            page,
            limit,
        });
    }
);

export const getProductDetail = asyncHandler(
    async (req: Request, res: Response) => {
        const { slug } = req.params;

        const product = await findProductDetailBySlug(slug);

        if (!product) {
            throw NotFoundError('Product not found');
        }

        res.status(200).json(product);
    }
);

export const searchProductsHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const query = req.query.q as string;
        const limit = Number(req.query.limit) || 10;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(200).json({ items: [] });
        }

        const products = await searchProducts(query, limit);

        res.status(200).json({
            items: products,
            query,
        });
    }
);

export const getFilterStatsHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const stats = await getFilterStats();
        res.status(200).json(stats);
    }
);
