import mongoose from 'mongoose';
import { CartModel } from '../models/cart.model';
import { OrderModel } from '../models/order.model';
import { UserModel } from '../models/user.model'; // Added for email lookup
import { AppError } from '../../../common/errors/app-error';
import { reserveInventory } from './inventory.service';
import { clearCart } from './cart.service';
import { ProductModel } from '../models/product.model';
import { createRazorpayOrder } from './payment.service';
import { EmailService } from './email.service'; // Added for email
import * as ShippingService from './shipping.service'; // Added for shipping
import { getSettings } from './admin-settings.service'; // Added for settings

interface CheckoutInput {
    userId: string;
    items?: Array<{ productId: string; quantity: number; size?: string; color?: string }>;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
    };
    paymentMethod: 'card' | 'cod' | 'upi';
    paymentDetails?: any;
}

// Helper to get user email
const getUserEmail = async (userId: string) => {
    const user = await UserModel.findById(userId);
    return user ? user.email : null;
};

export const processCheckout = async (input: CheckoutInput) => {
    const { userId, items: directItems, shippingAddress, paymentMethod, paymentDetails } = input;

    console.log('🔍 DEBUG: processCheckout called with:', {
        userId,
        hasDirectItems: !!(directItems && directItems.length > 0),
        directItemsCount: directItems?.length || 0,
        firstDirectItem: directItems?.[0]
    });

    // --- Delivery Estimation Logic ---
    let distanceKm = 0;
    let estimatedDeliveryDate = new Date();
    let sellerZipCode = '110001';

    try {
        const settings = await getSettings();
        sellerZipCode = settings.warehouseZipCode || '110001';

        // Use first item's sellerZipCode if available (future proofing), else warehouse
        // For now, simpler to verify logic: just use warehouse
        const estimation = await ShippingService.estimateDelivery(sellerZipCode, shippingAddress.zipCode);
        distanceKm = estimation.distanceKm;
        estimatedDeliveryDate = estimation.estimatedDate;
    } catch (err) {
        console.error('[CheckoutService] Delivery estimation failed:', err);
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);
    }
    // --------------------------------

    let checkoutItems: any[] = [];

    // 1. Get Items (either from direct input or from cart)
    if (directItems && directItems.length > 0) {
        // Buy Now Logic: Fetch products to ensure price and status are correct
        for (const item of directItems) {
            const product = await ProductModel.findById(item.productId);
            if (!product) throw new AppError(`Product not found: ${item.productId}`, 404);

            console.log('🔍 DEBUG: Processing direct item:', {
                productId: item.productId,
                quantity: item.quantity,
                size: item.size,
                color: item.color
            });

            checkoutItems.push({
                productId: product, // Store as object so reservation logic can use product._id
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                // Add Image for direct items
                image: product.images && product.images.length > 0 ? product.images[0].url : ''
            });
        }
    } else {
        // Cart Logic - Use CartModel directly to preserve all fields
        const cart = await CartModel.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            throw new AppError('Cart is empty', 400);
        }

        checkoutItems = cart.items.map(item => {
            const product = item.productId as any;
            return {
                ...item.toObject(),
                productId: product,
                // Extract image from populated product
                image: product.images && product.images.length > 0 ? product.images[0].url : ''
            };
        });
    }

    // 2. Start Transaction
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
    } catch (error: any) {
        session.endSession();
        // Detect MongoDB Standalone mode (no transactions)
        if (error.message && error.message.includes('replica set')) {
            throw new AppError('Database Transaction Failed: MongoDB must be running as a Replica Set to support transactions. Please enable Replica Set.', 500);
        }
        throw new AppError('Failed to start database transaction', 500);
    }

    try {
        let totalAmount = 0;
        const orderItems = [];

        // 3. Iterate and Reserve (Inventory v2 Logic with Variants)
        for (const item of checkoutItems) {
            const product = item.productId as any;

            // Check if active
            if (!product.isActive) {
                throw new AppError(`Product "${product.title}" is unavailable`, 400);
            }

            // ✅ VARIANT-AWARE RESERVATION
            let isReserved = false;

            // Check if product has variants and item specifies size/color
            if (product.variants && product.variants.length > 0 && item.size && item.color) {
                // Use variant-specific reservation
                const { reserveVariantInventory } = await import('./inventory.service');
                isReserved = await reserveVariantInventory(
                    product._id.toString(),
                    item.size,
                    item.color,
                    item.quantity,
                    session
                );
            } else {
                // Fallback to product-level reservation
                isReserved = await reserveInventory(
                    product._id.toString(),
                    item.quantity,
                    session
                );
            }

            if (!isReserved) {
                // If reservation fails, throwing here triggers the catch block,
                // which aborts the transaction and rolls back ANY successful reservations in this loop.
                const variantInfo = item.size && item.color ? ` (Size: ${item.size}, Color: ${item.color})` : '';
                throw new AppError(
                    `Insufficient stock for "${product.title}"${variantInfo}. Check availability.`,
                    409 // Conflict
                );
            }

            // Calculate price (using current price)
            const price = product.price?.amount || 0;
            totalAmount += price * item.quantity;

            orderItems.push({
                productId: product._id.toString(),
                title: product.title,
                quantity: item.quantity,
                price: price,
                size: item.size,      // Copy variant info from cart
                color: item.color,    // Copy variant info from cart
                image: item.image     // ✅ Add Image to Order
            });
        }

        // 4. Create Order (Status: PENDING)
        const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Create Razorpay order if payment method is UPI
        let razorpayOrderId: string | undefined = undefined;
        if (paymentMethod === 'upi') {
            try {
                const razorpayOrder = await createRazorpayOrder(totalAmount, orderId);
                razorpayOrderId = razorpayOrder.id;
                console.log('✅ Razorpay Order Created:', razorpayOrderId);
            } catch (error) {
                console.error('❌ Razorpay Order Creation Failed:', error);
                throw new AppError('Failed to create payment order. Please try again.', 500);
            }
        }

        const order = await OrderModel.create(
            [{
                orderId,
                userId,
                items: orderItems,
                total: totalAmount,
                status: 'PENDING',
                shippingAddress,

                // Delivery Info
                distanceKm,
                estimatedDeliveryDate,
                sellerZipCode,

                paymentMethod, // Add top level payment method
                paymentInfo: {
                    method: paymentMethod,
                    transactionId: paymentMethod === 'upi' ? razorpayOrderId : `PENDING-${Date.now()}`,
                    razorpayOrderId: razorpayOrderId || undefined,
                    paymentStatus: paymentMethod === 'upi' ? 'created' : 'pending'
                }
            }],
            { session }
        );

        // 5. Clear Cart (only if we ordered from cart)
        if (!directItems || directItems.length === 0) {
            await clearCart(userId);
        }

        // 6. Commit Transaction
        await session.commitTransaction();

        const createdOrder = order[0];

        // 7. Send Email (Post-Commit)
        const email = await getUserEmail(userId);
        if (email) {
            console.log(`[CheckoutService] Triggering confirmation email for order ${createdOrder.orderId} to ${email}`);
            EmailService.sendOrderConfirmation(email, createdOrder.toObject())
                .then(result => console.log(`[CheckoutService] Email send result: ${result}`))
                .catch(err => console.error('[CheckoutService] Email failed', err));
        } else {
            console.warn(`[CheckoutService] No email found for user ${userId}`);
        }

        // 8. Return the Order with Razorpay details
        return {
            ...createdOrder.toObject(),
            razorpayOrderId: razorpayOrderId,
            razorpayKeyId: paymentMethod === 'upi' ? process.env.RAZORPAY_KEY_ID : undefined
        };

    } catch (error: any) {
        // Rollback reservations if anything fails
        // Check if transaction was started before aborting
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        // Enhance error message for replica set issues that might happen during commit
        if (error.message && (error.message.includes('transaction numbers') || error.message.includes('replica set'))) {
            throw new AppError('Transaction Error: MongoDB Replica Set required for data integrity.', 500);
        }

        throw error;
    } finally {
        session.endSession();
    }
};