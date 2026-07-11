import { Router } from 'express';
import { getFinancialDashboard } from '../controllers/resources.controller';

const router = Router();

router.get('/dashboard', getFinancialDashboard);

export default router;
