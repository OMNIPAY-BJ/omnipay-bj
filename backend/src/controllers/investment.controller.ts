import { eq } from 'drizzle-orm';
import { Response } from 'express';
import { db } from '../db';
import { investments } from '../db/schema';
import { AuthenticatedRequest } from '../middlewares/auth';

function decimalStringToCents(value: string): number {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) return Number.NaN;

  const [, sign, whole, fraction = ''] = match;
  const cents = Number.parseInt(whole, 10) * 100 + Number.parseInt(fraction.padEnd(2, '0'), 10);
  return sign === '-' ? -cents : cents;
}

export async function getPortfolio(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    const holdings = await db.select().from(investments).where(eq(investments.userId, userId));
    const totalInvestedCents = holdings.reduce((sum, holding) => {
      const purchasePriceCents = decimalStringToCents(holding.purchasePrice);
      if (!Number.isFinite(purchasePriceCents)) {
        throw new Error('Invalid purchase price stored in database.');
      }

      return sum + purchasePriceCents * holding.quantity;
    }, 0);

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
