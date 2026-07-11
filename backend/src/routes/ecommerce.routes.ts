import { Router } from 'express';
import { body } from 'express-validator';
import { createOrder, listProducts } from '../controllers/ecommerce.controller';
import { validateRequest } from '../middlewares/validate';

const router = Router();

router.get('/products', listProducts);
router.post('/orders', body('productId').isUUID(), body('quantity').isInt({ min: 1 }), validateRequest, createOrder);

export default router;
