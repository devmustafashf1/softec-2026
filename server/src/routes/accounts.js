import { Router } from 'express';
import { changeAccountStatus, generateMessage, getMessages, deleteMessage, sendMessage } from '../controllers/accountsController.js';
import { getAllPaymentProofs, getPaymentProofs, updateProofStatus } from '../controllers/paymentProofsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/payment-proofs',                       getAllPaymentProofs);
router.patch('/:id/status',                         changeAccountStatus);
router.post('/:id/generate-message',                generateMessage);
router.get('/:id/messages',                         getMessages);
router.delete('/:id/messages/:messageId',           deleteMessage);
router.patch('/:id/messages/:messageId/send',       sendMessage);
router.get('/:id/payment-proofs',                   getPaymentProofs);
router.patch('/:id/payment-proofs/:proofId/status', updateProofStatus);

export default router;
