import { Router } from 'express';
import { listUsers, createUser, toggleUserStatus } from '../controllers/usersController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All user management requires a valid admin/agent session
router.use(requireAuth);

router.get('/',           listUsers);
router.post('/',          createUser);
router.patch('/:id/status', toggleUserStatus);

export default router;
