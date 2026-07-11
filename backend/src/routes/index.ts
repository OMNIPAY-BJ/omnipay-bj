import { Router } from 'express';
import authRoutes from './auth.routes';
import paymentsRoutes from './payments.routes';
import ecommerceRoutes from './ecommerce.routes';
import investmentRoutes from './investment.routes';
import resourcesRoutes from './resources.routes';
import adminRoutes from './admin.routes';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/payments', requireAuth, paymentsRoutes);
router.use('/ecommerce', requireAuth, ecommerceRoutes);
router.use('/investment', requireAuth, investmentRoutes);
router.use('/resources', requireAuth, resourcesRoutes);
router.use('/admin', requireAuth, adminRoutes);

export default router;
