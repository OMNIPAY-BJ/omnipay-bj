import { desc, eq } from 'drizzle-orm';
import { Response } from 'express';
import { db } from '../db';
import { orders, products } from '../db/schema';
import { AuthenticatedRequest } from '../middlewares/auth';

export async function listProducts(_req: AuthenticatedRequest, res: Response) {
  try {
    const items = await db.select().from(products).orderBy(desc(products.createdAt));
    return res.status(200).json({ items, checkout: 'ready', module: 'ecommerce' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[ecommerce-list-products]', error);
    return res.status(500).json({ message: 'Impossible de récupérer les produits.' });
  }
}

export async function createOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user?.id;
    const parsedQuantity = Number.parseInt(String(quantity), 10);

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({ message: 'Quantité invalide.' });
    }

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId)
    });

    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable.' });
    }

    const [order] = await db
      .insert(orders)
      .values({
        userId,
        productId,
        quantity: parsedQuantity,
        status: 'created'
      })
      .returning();

    return res.status(201).json({ status: 'created', order, product });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[ecommerce-create-order]', error);
    return res.status(500).json({ message: 'Impossible de créer la commande.' });
  }
}
