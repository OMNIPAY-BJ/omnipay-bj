import { Router } from 'express';
import { getAdminOverview } from '../controllers/admin.controller';

const router = Router();

router.get('/overview', getAdminOverview);

export default router;
