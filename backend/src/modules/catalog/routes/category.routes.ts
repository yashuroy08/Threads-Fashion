import { Router } from 'express';
import { getCategories, createCategoryHandler, updateCategoryHandler, deleteCategoryHandler } from '../controllers/category.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { requireRole } from '../../../common/middleware/rbac.middleware';
import { getCategoryById } from '../controllers/category.controller';

const router = Router();

router.get('/', getCategories);
router.get('/:id', getCategoryById);


router.post('/', authenticate, requireRole('admin'), createCategoryHandler);
router.put('/:id', authenticate, requireRole('admin'), updateCategoryHandler);
router.delete('/:id', authenticate, requireRole('admin'), deleteCategoryHandler);

export default router;
