import { Router } from 'express';
import { getDashboardStats, getClientsByStatus, changeAccountStatus, generateMessage, getMessages, deleteMessage, sendMessage } from '../controllers/accountsController.js';
import { getAllPaymentProofs, getPaymentProofs, updateProofStatus, deletePaymentProof } from '../controllers/paymentProofsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// Static routes must come before /:id param routes
router.get('/stats',                                getDashboardStats);
router.get('/clients',                              getClientsByStatus);
router.get('/payment-proofs',                       getAllPaymentProofs);
router.patch('/:id/status',                         changeAccountStatus);
router.post('/:id/generate-message',                generateMessage);
router.get('/:id/messages',                         getMessages);
router.delete('/:id/messages/:messageId',           deleteMessage);
router.patch('/:id/messages/:messageId/send',       sendMessage);
router.get('/:id/payment-proofs',                   getPaymentProofs);
router.patch('/:id/payment-proofs/:proofId/status', updateProofStatus);
router.delete('/:id/payment-proofs/:proofId',        deletePaymentProof);

export default router;
