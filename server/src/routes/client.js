import { Router } from 'express';
import { getClientFollowups, markFollowupsSeen } from '../controllers/accountsController.js';
import { submitPaymentProof, upload } from '../controllers/paymentProofsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/followups',        getClientFollowups);
router.patch('/followups/seen', markFollowupsSeen);
router.post('/payment-proof', (req, res, next) => {
  upload.single('receipt')(req, res, (err) => {
    if (err) {
      console.error('[multer]', err.message);
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, submitPaymentProof);

export default router;
