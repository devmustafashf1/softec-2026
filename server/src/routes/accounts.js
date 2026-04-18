import { Router } from 'express';
import { changeAccountStatus, generateMessage, getMessages } from '../controllers/accountsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.patch('/:id/status',           changeAccountStatus);
router.post('/:id/generate-message',  generateMessage);
router.get('/:id/messages',           getMessages);

export default router;
