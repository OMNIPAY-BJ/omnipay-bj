import { Router } from 'express';
import { body } from 'express-validator';
import { createTransfer, listTransactions } from '../controllers/payments.controller';
import { validateRequest } from '../middlewares/validate';

const router = Router();

router.get('/transactions', listTransactions);
router.post(
  '/transfers',
  body('amount').isFloat({ min: 0.01 }),
  body('recipientId').isUUID(),
  validateRequest,
  createTransfer
);

export default router;
