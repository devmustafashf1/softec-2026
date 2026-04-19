import { Router } from 'express';
import { chat } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/chat', chat);

export default router;
