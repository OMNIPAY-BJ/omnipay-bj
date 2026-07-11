import { Router } from 'express';
import { body } from 'express-validator';
import { login, signup } from '../controllers/auth.controller';

const router = Router();

router.post(
  '/signup',
  body('email').isEmail(),
  body('password').isLength({ min: 12 }),
  body('twoFactorCode').optional().isLength({ min: 6, max: 6 }),
  body('kycReference').optional().isString(),
  signup
);

router.post('/login', body('userId').optional().isString(), login);

export default router;
