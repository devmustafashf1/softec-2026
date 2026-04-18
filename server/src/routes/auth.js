import { Router } from 'express';
import { register, login, clientLogin, logout, me, refresh } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login',    login);
router.post('/logout',   logout);
router.post('/refresh',      refresh);
router.post('/client-login', clientLogin);

// Protected routes — must send: Authorization: Bearer <token>
router.get('/me', requireAuth, me);

export default router;
