import { Router } from 'express';
import { body } from 'express-validator';
import { createTransfer, listTransactions } from '../controllers/payments.controller';

const router = Router();

router.get('/transactions', listTransactions);
router.post('/transfers', body('amount').isNumeric(), body('recipientId').isString(), createTransfer);

export default router;
