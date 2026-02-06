import { Router } from 'express';
import { authenticate } from '../../../common/middleware/auth.middleware';
import {
    getWishlistHandler,
    addToWishlistHandler,
    removeFromWishlistHandler
} from '../controllers/wishlist.controller';

const router = Router();

router.use(authenticate); // All wishlist routes require auth

router.get('/', getWishlistHandler);
router.post('/add', addToWishlistHandler);
router.delete('/:productId', removeFromWishlistHandler);

export default router;
