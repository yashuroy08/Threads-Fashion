import { Router } from 'express';
// CHANGE: Import functions directly instead of "as OrderController"
import {
    checkoutHandler,
    createOrderHandler,
    listUserOrdersHandler,
    getOrderHandler,
    listOrdersHandler,
    updateOrderStatusHandler,
    cancelMyOrderHandler,
    requestReturnHandler,
    requestExchangeHandler,
    simulatePaymentFailure,
    simulatePaymentSuccess,
    deleteOrderHandler,
    bulkDeleteOrdersHandler
} from '../controllers/order.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { requireRole } from '../../../common/middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

// --- Admin routes ---
router.get('/admin/list', requireRole('admin'), listOrdersHandler);
router.patch('/admin/status/:id', requireRole('admin'), updateOrderStatusHandler);
router.delete('/admin/bulk-delete', requireRole('admin'), bulkDeleteOrdersHandler);
router.delete('/admin/:orderId', requireRole('admin'), deleteOrderHandler);

// --- User routes (Authenticated) ---
router.post('/checkout', checkoutHandler);
router.post('/', createOrderHandler);
router.get('/my-orders', listUserOrdersHandler);
router.get('/:id', getOrderHandler);
router.post('/cancel/:id', cancelMyOrderHandler);
router.post('/return/:id', requestReturnHandler);
router.post('/exchange/:id', requestExchangeHandler);

router.post('/admin/simulate-success/:orderId', requireRole('admin'), simulatePaymentSuccess)
router.post('/admin/simulate-failure/:orderId', requireRole('admin'), simulatePaymentFailure)

export default router;