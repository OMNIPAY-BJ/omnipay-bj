import { Router } from 'express';
import { getPortfolio } from '../controllers/investment.controller';

const router = Router();

router.get('/portfolio', getPortfolio);

export default router;
