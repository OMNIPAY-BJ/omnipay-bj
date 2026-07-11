import { eq } from 'drizzle-orm';
import { Response } from 'express';
import { db } from '../db';
import { investments } from '../db/schema';
import { AuthenticatedRequest } from '../middlewares/auth';

export async function getPortfolio(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    const holdings = await db.select().from(investments).where(eq(investments.userId, userId));
    const totalInvested = holdings.reduce((sum, holding) => sum + holding.quantity * holding.purchasePrice, 0);

    return res.status(200).json({
      holdings,
      analytics: {
        riskLevel: holdings.length > 0 ? 'moderate' : 'low',
        performance: 0,
        totalInvested
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de récupérer le portefeuille.' });
  }
}
