import { Router } from 'express';
import { body } from 'express-validator';
import { login, signup } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate';

const router = Router();

router.post(
  '/signup',
  body('email').isEmail(),
  body('password')
    .isLength({ min: 12 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/),
  body('twoFactorCode').optional().isLength({ min: 6, max: 6 }),
  body('kycReference').optional().isString(),
  validateRequest,
  signup
);

router.post('/login', body('email').isEmail(), body('password').isString().notEmpty(), validateRequest, login);

export default router;
