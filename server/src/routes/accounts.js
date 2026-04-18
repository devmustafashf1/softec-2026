import { Router } from 'express';
import { changeAccountStatus, generateMessage, getMessages, deleteMessage, sendMessage } from '../controllers/accountsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.patch('/:id/status',                         changeAccountStatus);
router.post('/:id/generate-message',                generateMessage);
router.get('/:id/messages',                         getMessages);
router.delete('/:id/messages/:messageId',           deleteMessage);
router.patch('/:id/messages/:messageId/send',       sendMessage);

export default router;
