import { Router } from 'express';
import {
    getProductList,
    getProductDetail,
    searchProductsHandler,
    getFilterStatsHandler,
} from '../controllers/catalog.controller';
import {
    updateProductHandler,
    deactivateProductHandler,
    reactivateProductHandler,
    createProductHandler,
    getAdminProductList,
} from '../controllers/admin-catalog.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { requireRole } from '../../../common/middleware/rbac.middleware';
import { cacheResponse } from '../../../common/middleware/cache.middleware';
import { noCache } from '../../../common/middleware/no-cache.middleware';

const router = Router();

// ---------- Public routes (with caching) ----------

// Short Cache (1 minute) for product listing
router.get('/', cacheResponse(60), getProductList);

// Filter metadata
router.get('/filters', cacheResponse(60), getFilterStatsHandler);

// Search endpoint (no cache for real-time results)
router.get('/search', searchProductsHandler);

// Long Cache (5 minutes) for product details
router.get('/:slug', cacheResponse(300), getProductDetail);
router.get('/:slug/details', cacheResponse(300), getProductDetail);

// ---------- Admin routes (Protected + No Cache) ----------

// Apply security and no-cache middleware to all admin routes
router.use('/admin', noCache, authenticate, requireRole('admin'));

router.get('/admin/products', getAdminProductList);
router.post('/admin/create', createProductHandler);
router.put('/admin/update/:id', updateProductHandler);
router.delete('/admin/deactivate/:id', deactivateProductHandler);
router.patch('/admin/reactivate/:id', reactivateProductHandler);

export default router;
