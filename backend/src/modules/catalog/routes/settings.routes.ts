import { Router } from 'express';
import { getPublicSettingsHandler } from '../controllers/admin-settings.controller';
import { cacheResponse } from '../../../common/middleware/cache.middleware';

const router = Router();

// Public route to get store settings (cached for 5 minutes)
router.get('/public', cacheResponse(300), getPublicSettingsHandler);

export default router;
