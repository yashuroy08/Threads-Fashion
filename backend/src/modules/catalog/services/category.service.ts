import { CategoryModel } from '../models/category.model';
import { AppError } from '../../../common/errors/app-error';
import { logAuditEvent } from './audit.service';

interface CreateCategoryInput {
    name: string;
    slug: string;
    parentId?: string;
    isActive?: boolean;
}

interface UpdateCategoryInput {
    name?: string;
    slug?: string;
    parentId?: string;
    isActive?: boolean;
}

export const createCategory = async (
    input: CreateCategoryInput,
    actor: { id: string; role: 'admin' }
) => {
    const existing = await CategoryModel.findOne({ slug: input.slug });
    if (existing) {
        throw new AppError('Category with this slug already exists', 409);
    }

    if (input.parentId) {
        const parent = await CategoryModel.findById(input.parentId);
        if (!parent) {
            throw new AppError('Parent category not found', 400);
        }
    }

    const category = await CategoryModel.create(input);

    await logAuditEvent({
        actorId: actor.id,
        actorRole: actor.role,
        action: 'CREATE_CATEGORY',
        entity: 'Category',
        entityId: category._id.toString(),
        metadata: { name: category.name }
    });

    return category;
};

export const updateCategory = async (
    id: string,
    updates: UpdateCategoryInput,
    actor: { id: string; role: 'admin' }
) => {
    const category = await CategoryModel.findById(id);
    if (!category) {
        throw new AppError('Category not found', 404);
    }

    if (updates.slug && updates.slug !== category.slug) {
        const existing = await CategoryModel.findOne({ slug: updates.slug });
        if (existing) {
            throw new AppError('Category with this slug already exists', 409);
        }
    }

    if (updates.parentId) {
        if (updates.parentId === id) {
            throw new AppError('Category cannot be its own parent', 400);
        }
        const parent = await CategoryModel.findById(updates.parentId);
        if (!parent) {
            throw new AppError('Parent category not found', 400);
        }
    }

    Object.assign(category, updates);
    await category.save();

    await logAuditEvent({
        actorId: actor.id,
        actorRole: actor.role,
        action: 'UPDATE_CATEGORY',
        entity: 'Category',
        entityId: category._id.toString(),
        metadata: { updates: Object.keys(updates) }
    });

    return category;
};

export const deleteCategory = async (
    id: string,
    actor: { id: string; role: 'admin' }
) => {
    const category = await CategoryModel.findById(id);
    if (!category) {
        throw new AppError('Category not found', 404);
    }

    // Optional: Check if products exist in this category before deleting
    // Or check if it has children
    const hasChildren = await CategoryModel.findOne({ parentId: id });
    if (hasChildren) {
        throw new AppError('Cannot delete category containing sub-categories', 400);
    }

    await CategoryModel.findByIdAndDelete(id);

    await logAuditEvent({
        actorId: actor.id,
        actorRole: actor.role,
        action: 'DELETE_CATEGORY',
        entity: 'Category',
        entityId: id,
        metadata: { name: category.name }
    });

    return true;
};