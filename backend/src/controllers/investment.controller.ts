import { Request, Response } from 'express';

export function getPortfolio(_req: Request, res: Response) {
  return res.status(200).json({ holdings: [], analytics: { riskLevel: 'moderate', performance: 0 } });
}
