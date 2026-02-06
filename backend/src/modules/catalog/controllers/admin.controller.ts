import { Request, Response } from 'express';
import { asyncHandler } from '../../../common/utils/async-handler';
import { AuditLogModel } from '../models/audit-log.model';
import { ProductModel } from '../models/product.model';
import { OrderModel } from '../models/order.model';
import { UserModel } from '../models/user.model';

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, actionType, userId, startDate, endDate } = req.query;
    const query: any = {};

    if (actionType) query.actionType = { $regex: actionType, $options: 'i' };
    if (userId) query.userId = { $regex: userId, $options: 'i' };
    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate as string);
        if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    const total = await AuditLogModel.countDocuments(query);
    const logs = await AuditLogModel.find(query)
        .sort({ timestamp: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

    res.json({
        logs,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
        }
    });
});

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const [productCount, orderCount, userCount, latestOrders, returnCount, exchangeCount, cancellationCount, activeOrderCount] = await Promise.all([
        ProductModel.countDocuments(),
        OrderModel.countDocuments(),
        UserModel.countDocuments(),
        OrderModel.find().sort({ createdAt: -1 }).limit(5),
        OrderModel.countDocuments({ status: { $in: ['RETURN_REQUESTED', 'RETURN_APPROVED'] } }),
        OrderModel.countDocuments({ status: { $in: ['EXCHANGE_REQUESTED', 'EXCHANGE_APPROVED'] } }),
        OrderModel.countDocuments({ status: 'CANCELLED' }),
        OrderModel.countDocuments({ status: { $in: ['PLACED', 'PENDING', 'CONFIRMED'] } })
    ]);

    const totalRevenue = await OrderModel.aggregate([
        { $match: { status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.json({
        stats: {
            products: productCount,
            orders: orderCount,
            users: userCount,
            revenue: totalRevenue[0]?.total || 0,

            // Sidebar Counts
            activeOrders: activeOrderCount,
            returns: returnCount,
            exchanges: exchangeCount,
            cancellations: cancellationCount
        },
        latestOrders
    });
});
