import { Request, Response } from 'express';
import { asyncHandler } from '../../../common/utils/async-handler';
import * as OrderService from '../services/order.service';
import * as CheckoutService from '../services/checkout.service';
import * as InventoryService from '../services/inventory.service';
import { logAuditEvent } from '../services/audit.service';
import { logUserActivity } from '../../../common/middleware/audit-logger';
import { OrderModel } from '../models/order.model';
import { AppError } from '../../../common/errors/app-error';
import { getSettings } from '../services/admin-settings.service';
import { isAfter, addHours, addDays } from 'date-fns';

// --- Existing Handlers ---

export const createOrderHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const settings = await getSettings();
        if (settings.maintenanceMode) {
            throw new AppError('Store is currently in maintenance mode. Please try again later.', 503);
        }
        const order = await OrderService.createOrder({ ...req.body, userId });
        res.status(201).json(order);
    }
);

export const getOrderHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const order = await OrderService.getOrderById(req.params.id);
        res.status(200).json(order);
    }
);

export const listOrdersHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const orders = await OrderService.listOrders();
        res.status(200).json(orders);
    }
);

export const updateOrderStatusHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const { status } = req.body;
        const userId = (req as any).user.id; // User performing the update (Admin)

        const order = await OrderService.updateOrderStatus(id, status);

        await logUserActivity({
            userId,
            actionType: 'ORDER_STATUS_UPDATE',
            description: `Order ${order.orderId} status updated to ${status}`,
            req,
            metadata: { orderId: order.orderId, oldStatus: 'unknown', newStatus: status }
        });

        res.status(200).json(order);
    }
);

export const listUserOrdersHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const orders = await OrderService.listUserOrders(userId);
        res.status(200).json(orders);
    }
);

// Allow authenticated users to cancel their own orders (respecting business rules in the service)
export const cancelMyOrderHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = (req as any).user.id;

        if (!reason || reason.trim().length < 10) {
            throw new AppError('Please provide a valid reason (minimum 10 characters) for cancellation', 400);
        }

        const order = await OrderService.getOrderById(id);
        if (order.userId !== userId) {
            throw new AppError('You are not allowed to cancel this order', 403);
        }

        if (order.status === 'DELIVERED') {
            throw new AppError('Cannot cancel an order that has already been delivered', 400);
        }

        // Additional check for cancelled
        if (order.status === 'CANCELLED') {
            throw new AppError('Order is already cancelled', 400);
        }

        const settings = await getSettings();
        const cancelDeadline = addHours(new Date(order.createdAt), settings.orderCancelWindowHours);

        if (isAfter(new Date(), cancelDeadline)) {
            throw new AppError(`Cancellation window of ${settings.orderCancelWindowHours} hours has passed`, 400);
        }

        const updated = await OrderService.updateOrderStatus(id, 'CANCELLED', reason);

        await logUserActivity({
            userId,
            actionType: 'ORDER_CANCELLED',
            description: `User cancelled order ${order.orderId}`,
            req,
            metadata: { orderId: order.orderId, reason }
        });

        res.status(200).json({
            message: 'Order cancelled successfully',
            order: updated,
        });
    }
);

export const requestReturnHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = (req as any).user.id;

        if (!reason || reason.trim().length < 10) {
            throw new AppError('Please provide a valid reason (minimum 10 characters) for return', 400);
        }

        const order = await OrderService.getOrderById(id);
        if (order.userId !== userId) {
            throw new AppError('You are not allowed to request return for this order', 403);
        }

        if (order.status !== 'DELIVERED') {
            throw new AppError('Return can only be requested after delivery', 400);
        }

        const settings = await getSettings();
        // Assuming updatedAt is the delivery time for now, ideally we should have a deliveredAt field
        const deliveryDate = order.updatedAt;
        const returnDeadline = addDays(new Date(deliveryDate), settings.returnWindowDays);

        if (isAfter(new Date(), returnDeadline)) {
            throw new AppError(`Return window of ${settings.returnWindowDays} days has passed`, 400);
        }

        const updated = await OrderService.requestReturn(id, reason);

        await logUserActivity({
            userId,
            actionType: 'RETURN_REQUESTED',
            description: `User requested return for order ${order.orderId}`,
            req,
            metadata: { orderId: order.orderId, reason }
        });

        res.status(200).json({
            message: 'Return request submitted successfully',
            order: updated,
        });
    }
);

export const requestExchangeHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = (req as any).user.id;

        if (!reason || reason.trim().length < 10) {
            throw new AppError('Please provide a valid reason (minimum 10 characters) for exchange', 400);
        }

        const order = await OrderService.getOrderById(id);
        if (order.userId !== userId) {
            throw new AppError('You are not allowed to request exchange for this order', 403);
        }

        if (order.status !== 'DELIVERED') {
            throw new AppError('Exchange can only be requested after delivery', 400);
        }

        const settings = await getSettings();
        const deliveryDate = order.updatedAt;
        const exchangeDeadline = addDays(new Date(deliveryDate), settings.exchangeWindowDays);

        if (isAfter(new Date(), exchangeDeadline)) {
            throw new AppError(`Exchange window of ${settings.exchangeWindowDays} days has passed`, 400);
        }

        const updated = await OrderService.requestExchange(id, reason);

        await logUserActivity({
            userId,
            actionType: 'EXCHANGE_REQUESTED',
            description: `User requested exchange for order ${order.orderId}`,
            req,
            metadata: { orderId: order.orderId, reason }
        });

        res.status(200).json({
            message: 'Exchange request submitted successfully',
            order: updated,
        });
    }
);

// --- New Checkout Handler (Make sure this is EXPORTED) ---

export const checkoutHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { items, shippingAddress, paymentMethod, paymentDetails } = req.body;

        const order = await CheckoutService.processCheckout({
            userId,
            items,
            shippingAddress,
            paymentMethod,
            paymentDetails
        });

        res.status(201).json({
            message: 'Order placed successfully',
            orderId: order.orderId,
            total: order.total,
            status: order.status
        });
    }
);

// --- Admin Delete Order ---
export const deleteOrderHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const { orderId } = req.params;
        const userId = (req as any).user.id;

        // Delete the order from the database
        const deletedOrder = await OrderModel.findOneAndDelete({ orderId });

        if (!deletedOrder) {
            throw new AppError('Order not found', 404);
        }

        await logUserActivity({
            userId,
            actionType: 'ORDER_DELETED',
            description: `Admin deleted order ${orderId}`,
            req,
            metadata: { orderId, deletedAt: new Date() }
        });

        res.status(200).json({
            message: 'Order deleted successfully',
            orderId
        });
    }
);

// --- Admin Bulk Delete Orders ---
export const bulkDeleteOrdersHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const { orderIds } = req.body;
        const userId = (req as any).user.id;

        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            throw new AppError('No order IDs provided', 400);
        }

        const result = await OrderModel.deleteMany({ orderId: { $in: orderIds } });

        await logUserActivity({
            userId,
            actionType: 'ORDERS_BULK_DELETED',
            description: `Admin bulk deleted ${result.deletedCount} orders`,
            req,
            metadata: { orderIds, deletedCount: result.deletedCount, deletedAt: new Date() }
        });

        res.status(200).json({
            message: `${result.deletedCount} orders deleted successfully`,
            deletedCount: result.deletedCount
        });
    }
);

export const simulatePaymentSuccess = asyncHandler(
    async (req: Request, res: Response) => {
        const { orderId } = req.params;
        const order = await OrderService.updateOrderStatus(orderId, 'PAID');
        res.json({ message: 'Payment Simulated: SUCCESS. Inventory Finalized.', order });
    }
);

export const simulatePaymentFailure = asyncHandler(
    async (req: Request, res: Response) => {
        const { orderId } = req.params;
        const order = await OrderService.updateOrderStatus(orderId, 'CANCELLED');
        res.json({ message: 'Payment Simulated: FAILED. Inventory Released.', order });
    }
);