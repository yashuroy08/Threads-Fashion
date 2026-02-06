import { Request, Response } from 'express';
import { asyncHandler } from '../../../common/utils/async-handler';
import { CategoryModel } from '../models/category.model';
import * as CategoryService from '../services/category.service';
import { AppError } from '../../../common/errors/app-error';
import { isValidObjectId } from 'mongoose';

export const getCategories = asyncHandler(
    async (_req: Request, res: Response) => {
        const categories = await CategoryModel.find({
            isActive: true,
        }).lean();

        res.json(categories);
    }
);

export const getCategoryById = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;

        // Determine if we are searching by ID or Slug
        const query = isValidObjectId(id)
            ? { _id: id }
            : { slug: id };

        const category = await CategoryModel.findOne(query).lean();

        if (!category) {
            throw new AppError('Category not found', 404);
        }

        res.status(200).json(category);
    }
);


export const createCategoryHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const category = await CategoryService.createCategory(
            req.body,
            req.user as { id: string; role: 'admin' }
        );
        res.status(201).json(category);
    }
);

export const updateCategoryHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const category = await CategoryService.updateCategory(
            req.params.id,
            req.body,
            req.user as { id: string; role: 'admin' }
        );
        res.status(200).json(category);
    }
);

export const deleteCategoryHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const category = await CategoryService.deleteCategory(
            req.params.id,
            req.user as { id: string; role: 'admin' }
        );
        res.status(200).json(category);
    }
);

