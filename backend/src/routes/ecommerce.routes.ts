import { Router } from 'express';
import { createOrder, listProducts } from '../controllers/ecommerce.controller';

const router = Router();

router.get('/products', listProducts);
router.post('/orders', createOrder);

export default router;
