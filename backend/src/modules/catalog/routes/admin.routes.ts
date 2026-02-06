import { Router } from 'express';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { requireRole } from '../../../common/middleware/rbac.middleware';
import { getAuditLogs, getDashboardStats } from '../controllers/admin.controller';

const router = Router();

// Protect all admin routes
router.use(authenticate);
router.use(requireRole('admin'));

// Existing Routes
router.get('/stats', getDashboardStats);
router.get('/audit', getAuditLogs);

// Settings Routes
import { getSettingsHandler, updateSettingsHandler } from '../controllers/admin-settings.controller';
router.get('/settings', getSettingsHandler);
router.put('/settings', updateSettingsHandler);

export default router;
