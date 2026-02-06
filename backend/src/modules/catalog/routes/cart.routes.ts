import { Router } from 'express';
import { authenticate } from '../../../common/middleware/auth.middleware';
import {
    getMyCart,
    addItemToCart,
    updateCartItem,
    removeCartItem,
    saveItemForLater,
    moveSavedToCart,
    clearCart
} from '../controllers/cart.controller';

const router = Router();

// All cart routes require authentication
router.use(authenticate);

router.get('/', getMyCart); // View Cart
router.delete('/', clearCart); // Clear Cart
router.post('/items', addItemToCart); // Add to Cart
router.patch('/items/:productId', updateCartItem); // Update Quantity
router.delete('/items/:productId', removeCartItem); // Remove Item

// Save for Later Routes
router.post('/saved/:productId', saveItemForLater); // Move to Saved
router.post('/saved/:productId/move-to-cart', moveSavedToCart); // Move back to Cart

export default router;