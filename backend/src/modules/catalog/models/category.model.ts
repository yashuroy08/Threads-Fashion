import { Schema, model, Document } from 'mongoose';

export interface CategoryDocument extends Document {
    name: string;
    slug: string;
    parentId?: string | null;
    isActive: boolean;
}

const CategorySchema = new Schema<CategoryDocument>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            index: true,
        },
        parentId: {
            type: String,
            default: null,
            index: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

export const CategoryModel = model<CategoryDocument>(
    'Category',
    CategorySchema
);
