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
    const totalInvestedCents = holdings.reduce(
      (sum, holding) => sum + Math.round(Number(holding.purchasePrice) * 100) * holding.quantity,
      0
    );

    return res.status(200).json({
      holdings,
      analytics: {
        riskLevel: holdings.length > 0 ? 'moderate' : 'low',
        performance: 0,
        totalInvested: totalInvestedCents / 100
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[investment-portfolio]', error);
    return res.status(500).json({ message: 'Impossible de récupérer le portefeuille.' });
  }
}
