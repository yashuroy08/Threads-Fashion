import { Router } from 'express';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { requireRole } from '../../../common/middleware/rbac.middleware';
import {
    getMyProfile,
    updateMyProfile,
    listAllUsers,
    adminUpdateUser,
    addAddress,
    deleteAddress,
    updateAddress,
    initiatePhoneVerification,
    completePhoneVerification
} from '../controllers/profile.controller';
const router = Router();

router.get('/me', authenticate, getMyProfile);
router.patch('/me', authenticate, updateMyProfile);
router.post('/me/verify-phone/init', authenticate, initiatePhoneVerification);
router.post('/me/verify-phone/complete', authenticate, completePhoneVerification);

// Address management routes
router.post('/me/addresses', authenticate, addAddress);
router.put('/me/addresses/:addressType', authenticate, updateAddress);
router.delete('/me/addresses/:addressType', authenticate, deleteAddress);

// Admin routes
router.get('/admin/users', authenticate, requireRole('admin'), listAllUsers);
router.patch('/admin/users/:id', authenticate, requireRole('admin'), adminUpdateUser);

export default router;
