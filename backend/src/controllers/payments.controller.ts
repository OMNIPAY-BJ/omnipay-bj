import { desc, eq, or } from 'drizzle-orm';
import { Response } from 'express';
import { db } from '../db';
import { transactions } from '../db/schema';
import { AuthenticatedRequest } from '../middlewares/auth';

export async function createTransfer(req: AuthenticatedRequest, res: Response) {
  try {
    const { amount, recipientId } = req.body;
    const userId = req.user?.id;
    const parsedAmount = Number.parseFloat(amount);

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Montant invalide.' });
    }

    const [transaction] = await db
      .insert(transactions)
      .values({
        userId,
        recipientId,
        amount: parsedAmount.toFixed(2),
        status: 'queued'
      })
      .returning();

    return res.status(201).json(transaction);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[payments-create-transfer]', error);
    return res.status(500).json({ message: 'Impossible de créer le transfert.' });
  }
}

export async function listTransactions(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    const items = await db
      .select()
      .from(transactions)
      .where(or(eq(transactions.userId, userId), eq(transactions.recipientId, userId)))
      .orderBy(desc(transactions.createdAt));

    return res.status(200).json({ items, receiptGeneration: 'enabled' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[payments-list-transactions]', error);
    return res.status(500).json({ message: 'Impossible de récupérer les transactions.' });
  }
}
