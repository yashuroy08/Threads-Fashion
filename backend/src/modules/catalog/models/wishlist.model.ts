import { Schema, model, Document, Types } from 'mongoose';

export interface WishlistDocument extends Document {
    userId: string;
    items: {
        productId: Types.ObjectId;
        addedAt: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const WishlistSchema = new Schema<WishlistDocument>(
    {
        userId: { type: String, required: true, unique: true, index: true },
        items: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                addedAt: { type: Date, default: Date.now }
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export const WishlistModel = model<WishlistDocument>('Wishlist', WishlistSchema);
