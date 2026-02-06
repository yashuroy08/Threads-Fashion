import { Schema, model, Document } from 'mongoose';

export interface OrderDocument extends Document {
    orderId: string;
    userId: string;
    items: {
        productId: string;
        title: string;
        quantity: number;
        price: number; // in paise
        size?: string;  // Variant: selected size
        color?: string; // Variant: selected color
        image?: string;
    }[];
    total: number; // in paise
    status: 'PENDING' | 'PAID' | 'CONFIRMED' | 'FAILED' | 'PLACED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' |
    'RETURN_REQUESTED' | 'RETURN_APPROVED' | 'RETURN_REJECTED' |
    'EXCHANGE_REQUESTED' | 'EXCHANGE_APPROVED' | 'EXCHANGE_REJECTED';
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
    };

    paymentMethod?: string;
    paymentDetails?: any;
    paymentInfo?: {
        method: string;
        transactionId?: string;
        razorpayOrderId?: string;
        paymentStatus?: string;
        paidAt?: Date;
    };
    inventoryProcessed: boolean;

    cancellationReason?: string;
    returnReason?: string;
    exchangeReason?: string;

    // Delivery Estimation
    estimatedDeliveryDate?: Date;
    distanceKm?: number;
    sellerZipCode?: string;

    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema = new Schema<OrderDocument>(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        userId: {
            type: String,
            required: true,
            index: true,
        },
        items: [
            {
                productId: { type: String, required: true },
                title: { type: String, required: true },
                quantity: { type: Number, required: true, min: 1 },
                price: { type: Number, required: true, min: 0 },
                size: { type: String },  // Variant: selected size
                color: { type: String }, // Variant: selected color
                image: { type: String }, // Product image URL
            },
        ],
        total: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: [
                'PENDING', 'PAID', 'CONFIRMED', 'FAILED', 'PLACED', 'SHIPPED', 'DELIVERED', 'CANCELLED',
                'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_REJECTED',
                'EXCHANGE_REQUESTED', 'EXCHANGE_APPROVED', 'EXCHANGE_REJECTED'
            ],
            default: 'PLACED',
        },
        shippingAddress: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zipCode: { type: String, required: true },
        },
        paymentMethod: { type: String, default: 'card' },
        paymentDetails: { type: Object },
        inventoryProcessed: { type: Boolean, default: false },
        cancellationReason: { type: String },
        returnReason: { type: String },
        exchangeReason: { type: String },
        distanceKm: { type: Number },
        sellerZipCode: { type: String },
        estimatedDeliveryDate: { type: Date }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const OrderModel = model<OrderDocument>('Order', OrderSchema);
