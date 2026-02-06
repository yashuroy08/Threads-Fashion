import { Schema, model, Document } from 'mongoose';

export interface CartItem {
    toObject(): any;
    productId: string;
    quantity: number;
    priceSnapshot: number; // Stored in paise
    size?: string;  // Variant: selected size
    color?: string; // Variant: selected color
    addedAt: Date;
}

export interface CartDocument extends Document {
    userId: string;
    items: CartItem[];
    savedForLater: {
        productId: string;
        addedAt: Date;
    }[];
    updatedAt: Date;
}

const CartItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product', // Reference to Product model for population
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    priceSnapshot: {
        type: Number,
        required: true,
    },
    size: { type: String },  // Variant: selected size
    color: { type: String }, // Variant: selected color
    addedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

const CartSchema = new Schema<CartDocument>(
    {
        userId: {
            type: String, // Or Schema.Types.ObjectId if your User IDs are ObjectIds
            required: true,
            unique: true,
            index: true,
        },
        items: [CartItemSchema],
        savedForLater: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product' },
                addedAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const CartModel = model<CartDocument>('Cart', CartSchema);