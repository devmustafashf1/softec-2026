import { Router } from 'express';
import { getClientFollowups, markFollowupsSeen } from '../controllers/accountsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/followups',        getClientFollowups);
router.patch('/followups/seen', markFollowupsSeen);

export default router;
