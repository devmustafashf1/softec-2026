import { Router } from 'express';
import { listUsers, createUser, toggleUserStatus, updateUserPayment, deleteUser } from '../controllers/usersController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All user management requires a valid admin/agent session
router.use(requireAuth);

router.get('/',                   listUsers);
router.post('/',                  createUser);
router.patch('/:id/status',       toggleUserStatus);
router.patch('/:id/payment',      updateUserPayment);
router.delete('/:id',             deleteUser);

export default router;
