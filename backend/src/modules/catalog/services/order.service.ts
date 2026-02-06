import { OrderModel } from '../models/order.model';
import { UserModel } from '../models/user.model';
import { EmailService } from './email.service'; // Import EmailService
import { AppError } from '../../../common/errors/app-error';
import { emitOrderUpdate } from '../../../common/utils/socket';
import * as InventoryService from './inventory.service';
import * as ShippingService from './shipping.service';
import { getSettings } from './admin-settings.service';

// Helper to get user email
const getUserEmail = async (userId: string) => {
    const user = await UserModel.findById(userId);
    return user ? user.email : null;
};

export const createOrder = async (orderData: any) => {
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Add Delivery Estimation
    let distanceKm = 0;
    let estimatedDeliveryDate = new Date();
    let sellerZipCode = '110001';

    try {
        const { ProductModel } = await import('../models/product.model');
        const firstItem = orderData.items[0];
        const product = await ProductModel.findById(firstItem.productId).lean();

        if (product && product.sellerZipCode) {
            sellerZipCode = product.sellerZipCode;
        } else {
            const settings = await getSettings();
            sellerZipCode = settings.warehouseZipCode || '';
        }
        const estimation = await ShippingService.estimateDelivery(sellerZipCode, orderData.shippingAddress.zipCode);
        distanceKm = estimation.distanceKm;
        estimatedDeliveryDate = estimation.estimatedDate;
    } catch (err) {
        console.error('Delivery estimation failed during order creation:', err);
        // Fallback: 5 days from now
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);
    }

    const order = await OrderModel.create({
        ...orderData,
        orderId,
        status: 'PENDING',
        distanceKm,
        estimatedDeliveryDate,
        sellerZipCode
    });

    // Check if PLACED immediately (e.g. COD) or if this comes after payment
    // For now assuming creation is the trigger, but if payment is separate, confirm there.
    // If status is PENDING, maybe don't email yet? 
    // Let's assume 'PLACED' or 'PENDING' gets an email "Order Received".

    const email = await getUserEmail(order.userId);
    if (email) {
        console.log(`[OrderService] Triggering confirmation email for order ${order.orderId} to ${email}`);
        // Run in background to not block response
        EmailService.sendOrderConfirmation(email, order)
            .then(result => console.log(`[OrderService] Email send result: ${result}`))
            .catch(err => console.error('[OrderService] Email failed', err));
    } else {
        console.warn(`[OrderService] No email found for user ${order.userId}, skipping confirmation email.`);
    }

    emitOrderUpdate(order);
    return order;
};

export const getOrderById = async (orderId: string) => {
    const orderDoc = await OrderModel.findOne({ orderId }).lean();
    if (!orderDoc) throw new AppError('Order not found', 404);

    // Manually populate product details
    const { ProductModel } = await import('../models/product.model');

    const order = orderDoc as any;
    for (const item of order.items) {
        try {
            const product = await ProductModel.findById(item.productId).select('title images slug category parentCategory childCategory').lean();
            item.product = product;
        } catch (err) {
            console.warn(`Failed to fetch product ${item.productId} for order ${order.orderId}:`, err);
            item.product = null;
        }
    }

    return order;
};

export const listOrders = async (query: any = {}) => {
    return await OrderModel.find(query).sort({ createdAt: -1 });
};

export const updateOrderStatus = async (orderId: string, status: string, reason?: string) => {
    const order = await OrderModel.findOne({ orderId });
    if (!order) throw new AppError('Order not found', 404);

    const oldStatus = order.status;
    const isReturnExchangeStatus = (s: string) => s.startsWith('RETURN_') || s.startsWith('EXCHANGE_');

    // Business rule: Delivered orders cannot be cancelled
    if (oldStatus === 'DELIVERED' && status === 'CANCELLED') {
        throw new AppError(
            'Delivered orders cannot be cancelled. Please initiate a return or exchange instead.',
            400
        );
    }

    // Business rule: Return & Exchange statuses only allowed if previously delivered OR already in return/exchange
    if (isReturnExchangeStatus(status)) {
        if (oldStatus !== 'DELIVERED' && !isReturnExchangeStatus(oldStatus)) {
            throw new AppError(
                'Return and Exchange requests are only allowed for delivered orders.',
                400
            );
        }
    }

    const isFinalStatus = ['PAID', 'SHIPPED', 'DELIVERED'].includes(status);
    const isCancelledStatus = status === 'CANCELLED';

    // 1. Check if inventory needs processing
    if (!order.inventoryProcessed) {
        if (isFinalStatus) {
            // Finalize Stock (Deduct from variants if size/color present, otherwise from total)
            for (const item of order.items) {
                if (item.size && item.color) {
                    await InventoryService.finalizeVariantInventory(
                        item.productId,
                        item.size,
                        item.color,
                        item.quantity
                    );
                } else {
                    await InventoryService.finalizeInventory(item.productId, item.quantity);
                }
            }
            order.inventoryProcessed = true;
        } else if (isCancelledStatus) {
            // Release Stock (Deduct R only)
            for (const item of order.items) {
                await InventoryService.releaseInventory(item.productId, item.quantity);
            }
            order.inventoryProcessed = true;
        }
    }

    // 2. Update Status and reason if provided
    order.status = status as any;
    if (reason) {
        if (status === 'CANCELLED') {
            order.cancellationReason = reason;
        }
    }
    await order.save();

    // Send Email Notification
    const email = await getUserEmail(order.userId);
    if (email) {
        EmailService.sendOrderStatusUpdate(email, order, status).catch(console.error);
    }

    emitOrderUpdate(order);
    return order;
};

export const requestReturn = async (orderId: string, reason: string) => {
    const order = await OrderModel.findOne({ orderId });
    if (!order) throw new AppError('Order not found', 404);

    if (order.status !== 'DELIVERED') {
        throw new AppError('Returns can only be requested for delivered orders', 400);
    }

    order.returnReason = reason;
    order.status = 'RETURN_APPROVED'; // ✅ Auto-approved
    await order.save();

    const email = await getUserEmail(order.userId);
    if (email) {
        EmailService.sendReturnRequestReceived(email, order).catch(console.error);
    }

    emitOrderUpdate(order);
    return order;
};

export const requestExchange = async (orderId: string, reason: string) => {
    const order = await OrderModel.findOne({ orderId });
    if (!order) throw new AppError('Order not found', 404);

    if (order.status !== 'DELIVERED') {
        throw new AppError('Exchanges can only be requested for delivered orders', 400);
    }

    order.exchangeReason = reason;
    order.status = 'EXCHANGE_APPROVED'; // ✅ Auto-approved
    await order.save();

    const email = await getUserEmail(order.userId);
    if (email) {
        EmailService.sendExchangeRequestReceived(email, order).catch(console.error);
    }

    emitOrderUpdate(order);
    return order;
};

export const listUserOrders = async (userId: string) => {
    const orders = await OrderModel.find({ userId }).sort({ createdAt: -1 }).lean();

    // Manually populate product details for each order
    const { ProductModel } = await import('../models/product.model');

    for (const order of orders) {
        for (const item of order.items) {
            try {
                const product = await ProductModel.findById(item.productId).select('title images slug category parentCategory childCategory').lean();
                (item as any).product = product;
            } catch (err) {
                console.warn(`Failed to fetch product ${item.productId} for order ${order.orderId}:`, err);
                (item as any).product = null;
            }
        }
    }

    return orders;
};
